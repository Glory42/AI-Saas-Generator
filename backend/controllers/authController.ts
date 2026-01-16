import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import config from '../config/config.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { apiError } from '../utils/apiError.js';

export const register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    if (!email || !password) {
        throw new apiError(400, 'Email and Password are required');
    }

    const freshUser = await User.creatUser({ email, password, username, role: 'user' });
    if (!freshUser || !freshUser.id) {
        console.error('Invalid user data returned: ', { freshUser });
        throw new apiError(401, 'Invalid user data returned');
    }

    const token = jwt.sign(
        { 
            id: freshUser.id,
            email, 
            role: freshUser.role,
            username: freshUser.username 
        },
        config.JWT_TOKEN,
        { expiresIn: '1h' }
    );

    res.status(201).json({ 
        message: 'User succesfully stored',
        user: {
            id: freshUser.id,
            email: freshUser.email,
            username: freshUser.username,
            role: freshUser.role,
        },
        token 
    });
});

export const login = asyncHandler(async (req:Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new apiError(400, 'Email and Password are required');
    }

    const user = await User.getUserByEmail(email);
    if (!user) {
        throw new apiError(404, 'User cannot be found or Invalid email');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new apiError(401, 'Invalid password');
    }
        

    const token = jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            username: user.username
        },
        config.JWT_TOKEN,
        { expiresIn: '1h' }
    );

    res.status(200).json({
        message: 'Login succefull',
        user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
        },
        token
    });
});