import supabase from '../config/database';
import bcrypt from 'bcryptjs';
import { 
    type CreateUserDTO, 
    type UserDTO,
    type UpdateUserDTO,
    type ProfileDTO
} from '../types/User';
import { validateUser } from '../utils/validator';

export default class User {
    static async createUser({ email, password, username, role = 'user' }:CreateUserDTO ): Promise<UserDTO> {
        try {
            validateUser({ email, password, username });

            if (!['user', 'admin'].includes(role)) {
                throw new Error('Invalid role');
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            
            const { data, error } = await supabase
                .from('users')
                .insert({
                    email,
                    password: hashedPassword,
                    username,
                    role,
                    created_at: new Date().toISOString(),
                    email_updated_at: new Date().toISOString(),
                    password_updated_at: new Date().toISOString(),
                    username_updated_at: new Date().toISOString(),
                })
                .select()
                .single()
                    
            if(error) {
                // Handle specific error codes
                if (error.code === '23505') { // Unique violation - email already exists
                    throw new Error('Email already exists');
                }
                throw error;
            }

            if(!data) {
                throw new Error('Failed to create user: No data returned');
            }

            return data;

        } catch (err) {
            if (err instanceof Error) {
                console.error(JSON.stringify({
                    action: 'Error while creating user',
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                }));
            }
            throw err;
        }
    }

    static async getUsers(): Promise<UserDTO[]>{
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*');
            if (error) throw error;

            return data;

        } catch (err) {
            if(err instanceof Error) {
                console.error(JSON.stringify({
                    action: 'Error fetching Users',
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                }));
            }
            throw new Error('Failed to fetch users');
        }
    }

    static async getUserById(id: string): Promise<UserDTO | null> {
        try {
            const { data, error } = await supabase
                .from('users') 
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;

            return data;

        } catch (err) {
            if(err instanceof Error) {
                console.error(JSON.stringify({
                    action: 'Error fetching User by ID',
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                }));
            }
            throw new Error('Failed to fetch users');
        }
    }

    static async getUserByEmail(email: string): Promise<UserDTO | null> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            if (error) throw error;

            return data;
             
        } catch (err) {
            if (err instanceof Error) {
                console.error(JSON.stringify({
                    action: 'Error fetching User by Email',
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                }));
            }
            throw new Error('Failed to fetch users');
        }
    }

    static async getUserProfile(id: string): Promise<ProfileDTO> {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, username, created_at')
                .eq('id', id)
                .single();
            if (error) throw error;

            return data;

        } catch (err) {
            if (err instanceof Error) {
                console.error(JSON.stringify({
                    action: 'Error fetching User Profile',
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                }));
            }
            throw new Error('Failed to fetch user profile');
        }
    }


    static async updateUser(id: string, updates: UpdateUserDTO): Promise<UserDTO> {
        try {
            // Explicit type-safe filtering
            const { email, username, password, role } = updates;
            
            const sanitizedUpdates: Partial<UpdateUserDTO> = {};
            const timestampUpdates: Record<string, string> = {};
            
            // Handle each field explicitly with type safety
            if (email !== undefined) {
                sanitizedUpdates.email = email;
                timestampUpdates.email_updated_at = new Date().toISOString();
            }
            
            if (username !== undefined) {
                sanitizedUpdates.username = username;
                timestampUpdates.username_updated_at = new Date().toISOString();
            }
            
            if (password !== undefined) {
                sanitizedUpdates.password = password;
                timestampUpdates.password_updated_at = new Date().toISOString();
            }
            
            // Role handling with type safety - only allow role updates with explicit validation
            if (role !== undefined && (role === 'user' || role === 'admin')) {
                sanitizedUpdates.role = role;  // Type-safe assignment
            }
            
            const { data, error } = await supabase
                .from('users')
                .update({ ...sanitizedUpdates, ...timestampUpdates })
                .eq('id', id)
                .select();
            
            if(error) {
                throw error;
            }

            return data[0];
            
        } catch (err) {
            if (err instanceof Error) {
                console.error(JSON.stringify({
                    action: 'Error while updating user',
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                }));
            }
            throw err;
        }
    }

    static async deleteUser(id: string): Promise<UserDTO | null>  {
        try {
            const { data, error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);
            
            if(error) {
                throw error;
            }
            
            return data;

        } catch (err) {
            if (err instanceof Error) {
                console.error(JSON.stringify({
                    action: 'Error while deleting user',
                    message: err.message,
                    stack: err.stack,
                    timestamp: new Date().toISOString()
                }));
            }
            throw err;
        }
    }
}