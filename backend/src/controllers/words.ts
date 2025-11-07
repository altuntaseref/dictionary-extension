import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";
import { getServiceClient } from "../services/supabase";

export async function handleGetWords(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        const url = new URL(request.url);
        const groupId = url.searchParams.get("group_id");

        const supabase = getServiceClient(env);
        
        // Build select query - handle case where group_id column might not exist
        let selectFields = "id, user_id, word, meaning, examples, notes, created_at";
        try {
            // Try to include group_id if it exists
            const { data: testData } = await supabase
                .from("words")
                .select("group_id")
                .limit(1);
            if (testData !== null) {
                selectFields += ", group_id";
            }
        } catch {
            // Column doesn't exist, continue without it
        }
        
        let query = supabase
            .from("words")
            .select(selectFields)
            .eq("user_id", userId);
        
        // Filter by group if provided and column exists
        if (groupId) {
            try {
                query = query.eq("group_id", groupId);
            } catch {
                // Ignore if group_id column doesn't exist
            }
        }
        
        const { data, error } = await query.order("created_at", { ascending: true });
        if (error) return jsonError(500, "db_error", error.message);

        return json({ words: data || [] });
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

export async function handleUpdateWordGroup(request: Request, env: Env, wordId: string): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        const body = await request.json().catch(() => ({}));
        const groupId = body?.group_id !== undefined ? (body.group_id === null ? null : String(body.group_id)) : undefined;
        
        if (groupId === undefined) {
            return jsonError(400, "invalid_request", "'group_id' is required (can be null to remove from group)");
        }

        const supabase = getServiceClient(env);
        
        // Verify word belongs to user
        const { data: existing, error: checkErr } = await supabase
            .from("words")
            .select("id")
            .eq("id", wordId)
            .eq("user_id", userId)
            .single();
        
        if (checkErr || !existing) {
            return jsonError(404, "not_found", "Word not found");
        }

        // If group_id is provided, verify it belongs to user
        if (groupId !== null) {
            const { data: group, error: groupErr } = await supabase
                .from("word_groups")
                .select("id")
                .eq("id", groupId)
                .eq("user_id", userId)
                .single();
            
            if (groupErr || !group) {
                return jsonError(404, "not_found", "Group not found");
            }
        }

        // Update word's group
        const { data, error } = await supabase
            .from("words")
            .update({ group_id: groupId })
            .eq("id", wordId)
            .eq("user_id", userId)
            .select("id, word, meaning, group_id")
            .single();
        
        if (error) return jsonError(500, "db_error", error.message);
        return json({ word: data });
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
