class SecureStorage {
    private secretKey: string;

    constructor() {
        this.secretKey = this.generateSecretKey();
    }

    private generateSecretKey(): string {
        let key = localStorage.getItem('secureStorageKey');
        
        if (!key) {
            const userAgent = navigator.userAgent;
            key = btoa(userAgent + 'ai-saas-generator-secret-salt').slice(0, 32);
            localStorage.setItem('secureStorageKey', key);
        }
        
        return key;
    }

    private simpleEncrypt(text: string, key: string): string {
        let encrypted = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            encrypted += String.fromCharCode(charCode ^ keyChar);
        }
        return btoa(encrypted);
    }

    private simpleDecrypt(encryptedText: string, key: string): string {
        try {
            const encrypted = atob(encryptedText);
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                decrypted += String.fromCharCode(charCode ^ keyChar);
            }
            return decrypted;
        } catch (error) {
            console.error('Decryption failed:', error);
            return '';
        }
    }

    setItem(key: string, value: string): void {
        try {
            const encrypted = this.simpleEncrypt(value, this.secretKey);
            localStorage.setItem(key, encrypted);
        } catch (error) {
            console.error('Failed to encrypt and store item:', error);
            localStorage.setItem(key, value);
        }
    }

    getItem(key: string): string | null {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            
            const decrypted = this.simpleDecrypt(encrypted, this.secretKey);
            if (decrypted) return decrypted;
            
            return encrypted;
        } catch (error) {
            console.error('Failed to decrypt item:', error);
            return localStorage.getItem(key);
        }
    }

    removeItem(key: string): void {
        localStorage.removeItem(key);
    }

    clear(): void {
        localStorage.clear();
    }

    setSessionItem(key: string, value: string): void {
        try {
            const encrypted = this.simpleEncrypt(value, this.secretKey);
            sessionStorage.setItem(key, encrypted);
        } catch (error) {
            console.error('Failed to encrypt and store session item:', error);
            sessionStorage.setItem(key, value);
        }
    }

    getSessionItem(key: string): string | null {
        try {
            const encrypted = sessionStorage.getItem(key);
            if (!encrypted) return null;
            
            const decrypted = this.simpleDecrypt(encrypted, this.secretKey);
            if (decrypted) return decrypted;
            
            return encrypted;
        } catch (error) {
            console.error('Failed to decrypt session item:', error);
            return sessionStorage.getItem(key);
        }
    }

    removeSessionItem(key: string): void {
        sessionStorage.removeItem(key);
    }
}

export const secureStorage = new SecureStorage();