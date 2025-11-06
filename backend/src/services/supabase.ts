import { createClient } from "@supabase/supabase-js";
import type { Env } from "../index";

export function getServiceClient(env: Env) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: { "X-Client-Info": "dictionary-backend" } },
    });
    return supabase;
}

export interface WordRow {
    id: string;
    user_id: string;
    word: string;
    meaning: string | null;
    examples: unknown | null;
    notes: string | null;
    created_at: string;
}


