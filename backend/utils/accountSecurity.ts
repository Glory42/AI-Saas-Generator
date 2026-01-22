import supabase from "../config/database";

export interface FailedLoginAttempt {
    email: string;
    ip_address: string;
    attempted_at: string;
    user_agent?: string;
    reason: string;
}

export interface AccountLockout {
    email: string;
    locked_at: string;
    unlock_at: string;
    reason: string;
    is_active: boolean;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const MAX_IP_ATTEMPTS = 10;

export const AccountSecurity = {
    /**
     * Maximum failed attempts before lockout
     */
    get MAX_FAILED_ATTEMPTS() { return MAX_FAILED_ATTEMPTS; },
    
    /**
     * Lockout duration in milliseconds
     */
    get LOCKOUT_DURATION() { return LOCKOUT_DURATION; },

    /**
     * IP-based lockout threshold
     */
    get MAX_IP_ATTEMPTS() { return MAX_IP_ATTEMPTS; },

    recordFailedLogin: async (
        email: string, 
        ip: string, 
        reason: string, 
        userAgent?: string
    ): Promise<void> => {
        try {
            await supabase.from("failed_login_attempts").insert({
                email: email.toLowerCase(),
                ip_address: ip,
                reason,
                user_agent: userAgent
            });
        } catch (error) {
            console.error("Error recording failed login:", error);
        }
    },

    isAccountLocked: async (email: string): Promise<AccountLockout | null> => {
        try {
            const { data, error } = await supabase
                .from("account_lockouts")
                .select("*")
                .eq("email", email.toLowerCase())
                .eq("is_active", true)
                .gt("unlock_at", new Date().toISOString())
                .single();

            if (error || !data) {
                return null;
            }

            return data as AccountLockout;
        } catch (error) {
            console.error("Error checking account lockout:", error);
            return null;
        }
    },

    isIPLocked: async (ip: string): Promise<boolean> => {
        try {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            
            const { count, error } = await supabase
                .from("failed_login_attempts")
                .select("*", { count: 'exact', head: true })
                .eq("ip_address", ip)
                .gte("attempted_at", oneHourAgo);

            if (error) {
                console.error("Error checking IP lock status:", error);
                return false;
            }

            return (count ?? 0) >= MAX_IP_ATTEMPTS;
        } catch (error) {
            console.error("Error in isIPLocked:", error);
            return false;
        }
    },

    lockAccount: async (
        email: string, 
        reason: string, 
        duration?: number
    ): Promise<boolean> => {
        try {
            const lockoutDuration = duration ?? LOCKOUT_DURATION;
            const lockedAt = new Date();
            const unlockAt = new Date(Date.now() + lockoutDuration);

            await supabase
                .from("account_lockouts")
                .update({ is_active: false })
                .eq("email", email.toLowerCase());

            const { error } = await supabase.from("account_lockouts").insert({
                email: email.toLowerCase(),
                locked_at: lockedAt.toISOString(),
                unlock_at: unlockAt.toISOString(),
                reason,
                is_active: true
            });

            if (error) {
                console.error("Error locking account:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error in lockAccount:", error);
            return false;
        }
    },

    getFailedAttemptsCount: async (email: string): Promise<number> => {
        try {
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
            
            const { count, error } = await supabase
                .from("failed_login_attempts")
                .select("*", { count: 'exact', head: true })
                .eq("email", email.toLowerCase())
                .gte("attempted_at", thirtyMinutesAgo);

            if (error) {
                console.error("Error getting failed attempts count:", error);
                return 0;
            }

            return count ?? 0;
        } catch (error) {
            console.error("Error in getFailedAttemptsCount:", error);
            return 0;
        }
    },

    resetFailedAttempts: async (email: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("failed_login_attempts")
                .delete()
                .eq("email", email.toLowerCase());

            if (error) {
                console.error("Error resetting failed attempts:", error);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Error in resetFailedAttempts:", error);
            return false;
        }
    },

    checkAndLockIfNeeded: async (email: string): Promise<boolean> => {
        try {
            const failedCount = await AccountSecurity.getFailedAttemptsCount(email);
            
            if (failedCount >= MAX_FAILED_ATTEMPTS) {
                const reason = `Account locked after ${failedCount} failed login attempts`;
                await AccountSecurity.lockAccount(email, reason);
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error in checkAndLockIfNeeded:", error);
            return false;
        }
    },

    unlockAccount: async (email: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from("account_lockouts")
                .update({ is_active: false })
                .eq("email", email.toLowerCase());

            if (error) {
                console.error("Error unlocking account:", error);
                return false;
            }

            // Also reset failed attempts when unlocking
            await AccountSecurity.resetFailedAttempts(email);

            return true;
        } catch (error) {
            console.error("Error in unlockAccount:", error);
            return false;
        }
    },

    getRecentFailedAttempts: async (limit: number = 50): Promise<FailedLoginAttempt[]> => {
        try {
            const { data, error } = await supabase
                .from("failed_login_attempts")
                .select("*")
                .order("attempted_at", { ascending: false })
                .limit(limit);

            if (error) {
                console.error("Error getting recent failed attempts:", error);
                return [];
            }

            return data as FailedLoginAttempt[];
        } catch (error) {
            console.error("Error in getRecentFailedAttempts:", error);
            return [];
        }
    },

    getActiveLockouts: async (): Promise<AccountLockout[]> => {
        try {
            const { data, error } = await supabase
                .from("account_lockouts")
                .select("*")
                .eq("is_active", true)
                .gt("unlock_at", new Date().toISOString())
                .order("locked_at", { ascending: false });

            if (error) {
                console.error("Error getting active lockouts:", error);
                return [];
            }

            return data as AccountLockout[];
        } catch (error) {
            console.error("Error in getActiveLockouts:", error);
            return [];
        }
    },

    cleanupOldData: async (): Promise<{ failedAttempts: number; lockouts: number }> => {
        try {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
            const { count: failedCount } = await supabase
                .from("failed_login_attempts")
                .delete({ count: 'exact' })
                .lt("attempted_at", thirtyDaysAgo);

            const { count: lockoutCount } = await supabase
                .from("account_lockouts")
                .update({ is_active: false }, { count: 'exact' })
                .lt("unlock_at", new Date().toISOString())
                .eq("is_active", true);

            return {
                failedAttempts: failedCount ?? 0,
                lockouts: lockoutCount ?? 0
            };
        } catch (error) {
            console.error("Error in cleanupOldData:", error);
            return { failedAttempts: 0, lockouts: 0 };
        }
    }
};