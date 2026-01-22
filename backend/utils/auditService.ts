import { createClient } from "@supabase/supabase-js";
import env from "../config/config";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

export const AuditService = {
    async log(userId: string | null, action: string, details: any = {}, ip?: string) {
        try {
        supabase.from("audit_logs").insert({
            user_id: userId,
            action: action.toUpperCase(),
            details: details,
            ip_address: ip
        }).then(({ error }) => {
            if (error) console.error("Warning: Audit log failed", error.message);
        });
        } catch (err) {
        console.error("Audit Service Error:", err);
        }
    }
};