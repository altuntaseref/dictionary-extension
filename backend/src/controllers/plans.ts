import type { Env } from "../index";
import { getServiceClient } from "../services/supabase";

export async function handleListPlans(request: Request, env: Env): Promise<Response> {
    try {
        const supabase = getServiceClient(env);
        const { data, error } = await supabase
            .from("plans")
            .select("id, name, display_name, price, currency, max_words, can_export, can_use_groups, can_access_exercises")
            .order("price", { ascending: true });

        if (error) {
            return jsonError(500, "db_error", error.message);
        }

        return json({ plans: data || [] });
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

function json(data: unknown, init: ResponseInit = {}): Response {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(data), { ...init, headers });
}

function jsonError(status: number, code: string, message: string): Response {
    return json({ error: { code, message } }, { status });
}


