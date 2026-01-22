import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';
import { AuditService } from '../utils/auditService.js';
import { TokenService } from '../utils/tokenService.js';
import { AccountSecurity } from '../utils/accountSecurity.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    if (!email || !password) {
        throw new apiError(400, 'Email and Password are required');
    }

    const freshUser = await User.createUser({ email, password, username, role: 'user' });
    if (!freshUser || !freshUser.id) {
        console.error('Invalid user data returned: ', { freshUser });
        throw new apiError(401, 'Invalid user data returned');
    }

    const accessToken = TokenService.generateAccessToken(freshUser);
    const refreshToken = TokenService.generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await TokenService.saveRefreshToken(freshUser.id, refreshToken, expiresAt, {
        ip: req.ip,
        userAgent: req.get('User-Agent') || "Unknown"
    });

    const clientIP = req.ip || req.socket.remoteAddress;
    await AuditService.log(freshUser.id, "USER_REGISTRATION", { 
        email: freshUser.email, 
        username: freshUser.username 
    }, clientIP);

    res.status(201).json({ 
        message: 'User successfully stored',
        user: {
            id: freshUser.id,
            email: freshUser.email,
            username: freshUser.username,
            role: freshUser.role,
        },
        token: accessToken,
        refreshToken 
    });
});

export const login = asyncHandler(async (req:Request, res: Response) => {
    const { email, password } = req.body;
    const clientIP = req.ip || req.socket.remoteAddress || "Unknown";
    
    if (!email || !password) {
        throw new apiError(400, 'Email and Password are required');
    }

    const isLocked = await AccountSecurity.isAccountLocked(email);
    if (isLocked) {
        await AuditService.log(null, "LOGIN_BLOCKED", { 
            email, 
            ip: clientIP || "Unknown",
            reason: "Account locked",
            unlockAt: isLocked.unlock_at
        }, clientIP);
        
        throw new apiError(429, `Account temporarily locked. Try again after ${new Date(isLocked.unlock_at).toLocaleString()}`);
    }

    // Check IP lock status
    const isIPLocked = await AccountSecurity.isIPLocked(clientIP);
    if (isIPLocked) {
        await AuditService.log(null, "LOGIN_BLOCKED", { 
            email, 
            ip: clientIP || "Unknown",
            reason: "IP address blocked due to too many failed attempts"
        }, clientIP);
        
        throw new apiError(429, "Too many failed attempts from this IP address. Try again later.");
    }

    const user = await User.getUserByEmail(email);
    if (!user) {
        await AccountSecurity.recordFailedLogin(email, clientIP, "User not found", req.get('User-Agent') || "Unknown" || "Unknown");
        await AccountSecurity.checkAndLockIfNeeded(email);
        
        await AuditService.log(null, "FAILED_LOGIN", { 
            email, 
            ip: clientIP || "Unknown",
            reason: "User not found"
        }, clientIP);
        
        throw new apiError(404, 'User cannot be found or Invalid email');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        // Record failed attempt
        await AccountSecurity.recordFailedLogin(email, clientIP, "Invalid password", req.get('User-Agent') || "Unknown" || "Unknown");
        
        // Check if account should be locked
        const shouldLock = await AccountSecurity.checkAndLockIfNeeded(email);
        
        await AuditService.log(null, "FAILED_LOGIN", { 
            email, 
            ip: clientIP || "Unknown",
            reason: "Invalid password",
            accountLocked: shouldLock
        }, clientIP);
        
        throw new apiError(401, 'Invalid password');
    }

    await AccountSecurity.resetFailedAttempts(email);

    const accessToken = TokenService.generateAccessToken(user);
    const refreshToken = TokenService.generateRefreshToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await TokenService.saveRefreshToken(user.id, refreshToken, expiresAt, {
        ip: clientIP || "Unknown",
        userAgent: req.get('User-Agent') || "Unknown"
    });

    await AuditService.log(user.id, "USER_LOGIN", { 
        email: user.email,
        loginMethod: "password",
        ip: clientIP || "Unknown",
        userAgent: req.get('User-Agent') || "Unknown"
    }, clientIP);

    res.status(200).json({
        message: 'Login successful',
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
        token: accessToken,
        refreshToken
    });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        throw new apiError(400, "Refresh token is required");
    }

    const tokenData = await TokenService.validateRefreshToken(refreshToken);
    if (!tokenData) {
        throw new apiError(401, "Invalid or expired refresh token");
    }

    const user = await User.getUserById(tokenData.user_id);
    if (!user) {
        throw new apiError(401, "User not found");
    }

    const newAccessToken = TokenService.generateAccessToken(user);
    const newRefreshToken = TokenService.generateRefreshToken();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await TokenService.revokeRefreshToken(refreshToken, "Token rotation");
    await TokenService.saveRefreshToken(user.id, newRefreshToken, newExpiresAt, {
        ip: req.ip || req.socket.remoteAddress || "Unknown",
        userAgent: req.get('User-Agent') || "Unknown"
    });

    const clientIP = req.ip || req.socket.remoteAddress || "Unknown";
    await AuditService.log(user.id, "TOKEN_REFRESHED", { 
        ip: clientIP,
        userAgent: req.get('User-Agent') || "Unknown"
    }, clientIP);

    res.json({
        token: newAccessToken,
        refreshToken: newRefreshToken
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const clientIP = req.ip || req.socket.remoteAddress || "Unknown";

    if (refreshToken) {
        const tokenData = await TokenService.validateRefreshToken(refreshToken);
        if (tokenData) {
            await TokenService.revokeRefreshToken(refreshToken, "User logout");
            
            await AuditService.log(tokenData.user_id, "USER_LOGOUT", { 
                ip: clientIP,
                method: "refresh_token_revoked"
            }, clientIP);
        }
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jwt.decode(token) as any;
            if (decoded && decoded.jti && req.user?.id) {
                await TokenService.blacklistAccessToken(decoded.jti, req.user.id, "User logout", clientIP);
                
                await AuditService.log(req.user.id, "USER_LOGOUT", { 
                    ip: clientIP,
                    method: "access_token_blacklisted"
                }, clientIP);
            }
        } catch (error) {
            console.error("Error decoding token during logout:", error);
        }
    }

    res.json({ message: "Logged out successfully" });
});

export const logoutAllDevices = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.id) {
        throw new apiError(401, "User not authenticated");
    }

    const clientIP = req.ip || req.socket.remoteAddress || "Unknown";

    const success = await TokenService.revokeAllUserTokens(req.user.id, "Logout all devices");
    
    if (success) {
        await AuditService.log(req.user.id, "USER_LOGOUT_ALL", { 
            ip: clientIP,
            method: "all_devices"
        }, clientIP);
    }

    res.json({ message: "Logged out from all devices successfully" });
});