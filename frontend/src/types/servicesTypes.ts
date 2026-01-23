export interface AuthResponse {
    user: {
        id: string;
        email: string;
        username: string;
        role: string;
    };
    token: string;
    refreshToken: string;
    message?: string;
}

