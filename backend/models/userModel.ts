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
    static async creatUser({ email, password, username, role = 'user' }:CreateUserDTO ): Promise<UserDTO> {
        try {
            validateUser({ email, password, username });

            if (!['user', 'admin'].includes(role)) {
                throw new Error('Invalid role');
            }

            const harsedPassword = await bcrypt.hash(password, 10);
            
            const { data, error } = await supabase
                .from('users')
                .insert({
                    email,
                    password: harsedPassword,
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
                throw error;
            }

            if(!data || data.length === 0) {
                const { data: manualData, error: manualError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', email)
                    .single();
                if (manualError) {
                    throw manualError;
                }
                return manualData;
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
            const { data, error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    email_updated_at: new Date().toISOString(),
                    password_updated_at: new Date().toISOString(),
                    username_updated_at: new Date().toISOString(),
                    phone_updated_at: new Date().toISOString(),
                })
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