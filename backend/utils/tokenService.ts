import crypto from "crypto";
import jwt from "jsonwebtoken";
import supabase from "../config/database";
import config from "../config/config";

export interface RefreshTokenData {
    id: string;
    user_id: string;
    token: string;
    expires_at: string;
    is_revoked: boolean;
    device_info?: any;
}

export interface DeviceInfo {
    ip?: string;
    userAgent?: string;
    platform?: string;
    browser?: string;
}

export const TokenService = {
    generateRefreshToken: (): string => {
        return crypto.randomBytes(40).toString('hex');
    },

    generateAccessToken: (user: { id: string; email: string; role: string; username?: string }): string => {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            username: user.username,
            type: 'access',
            jti: crypto.randomUUID() // JWT ID for blacklisting
        };

        return jwt.sign(payload, config.JWT_TOKEN, { 
            expiresIn: '1h',
            issuer: 'ai-saas-app',
            audience: 'ai-saas-users'
        });
    },

    saveRefreshToken: async (
        userId: string, 
        token: string, 
        expiresAt: Date, 
        deviceInfo?: DeviceInfo
    ): Promise<boolean> => {
        try {
            const { error } = await supabase.from("refresh_tokens").insert({
                user_id: userId,
                token: token,
                expires_at: expiresAt.toISOString(),
                device_info: deviceInfo || {}
            });

            if (error) {
                console.error("Error saving refresh token:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error in saveRefreshToken:", error);
            return false;
        }
    },

    validateRefreshToken: async (token: string): Promise<RefreshTokenData | null> => {
        try {
            const { data, error } = await supabase
                .from("refresh_tokens")
                .select("*")
                .eq("token", token)
                .eq("is_revoked", false)
                .gt("expires_at", new Date().toISOString())
                .single();

            if (error || !data) {
                return null;
            }

            await supabase
                .from("refresh_tokens")
                .update({ last_used_at: new Date().toISOString() })
                .eq("id", data.id);

            return data as RefreshTokenData;
        } catch (error) {
            console.error("Error validating refresh token:", error);
            return null;
        }
    },

    revokeRefreshToken: async (token: string, reason?: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("refresh_tokens")
                .update({ 
                    is_revoked: true, 
                    revoked_at: new Date().toISOString() 
                })
                .eq("token", token);

            if (error) {
                console.error("Error revoking refresh token:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error in revokeRefreshToken:", error);
            return false;
        }
    },

    revokeAllUserTokens: async (userId: string, reason?: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("refresh_tokens")
                .update({ 
                    is_revoked: true, 
                    revoked_at: new Date().toISOString() 
                })
                .eq("user_id", userId)
                .eq("is_revoked", false);

            if (error) {
                console.error("Error revoking all user tokens:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error in revokeAllUserTokens:", error);
            return false;
        }
    },

    blacklistAccessToken: async (jti: string, userId?: string, reason?: string, ip?: string): Promise<boolean> => {
        try {
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

            const { error } = await supabase.from("token_blacklist").insert({
                token_id: jti,
                user_id: userId,
                expires_at: expiresAt.toISOString(),
                reason: reason || "Token revocation",
                ip_address: ip
            });

            if (error) {
                console.error("Error blacklisting access token:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error in blacklistAccessToken:", error);
            return false;
        }
    },

    isAccessTokenBlacklisted: async (jti: string): Promise<boolean> => {
        try {
            const { data, error } = await supabase
                .from("token_blacklist")
                .select("id")
                .eq("token_id", jti)
                .gt("expires_at", new Date().toISOString())
                .single();

            if (error || !data) {
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error checking token blacklist:", error);
            return false;
        }
    },

    getUserActiveTokens: async (userId: string): Promise<RefreshTokenData[]> => {
        try {
            const { data, error } = await supabase
                .from("refresh_tokens")
                .select("*")
                .eq("user_id", userId)
                .eq("is_revoked", false)
                .gt("expires_at", new Date().toISOString())
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error getting user tokens:", error);
                return [];
            }

            return data as RefreshTokenData[];
        } catch (error) {
            console.error("Error in getUserActiveTokens:", error);
            return [];
        }
    },

    cleanupExpiredTokens: async (): Promise<{ refreshTokens: number; blacklistedTokens: number }> => {
        try {
            const { count: refreshCount } = await supabase
                .from("refresh_tokens")
                .delete({ count: 'exact' })
                .lt("expires_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // 24 hours buffer

            const { count: blacklistCount } = await supabase
                .from("token_blacklist")
                .delete({ count: 'exact' })
                .lt("expires_at", new Date().toISOString());

            return {
                refreshTokens: refreshCount || 0,
                blacklistedTokens: blacklistCount || 0
            };
        } catch (error) {
            console.error("Error in cleanupExpiredTokens:", error);
            return { refreshTokens: 0, blacklistedTokens: 0 };
        }
    }
};