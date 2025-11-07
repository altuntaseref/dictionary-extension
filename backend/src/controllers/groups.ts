import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";
import { checkPlanLimit } from "../middleware/planCheck";
import { getServiceClient } from "../services/supabase";

export async function handleGetGroups(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        
        // No plan check for GET - users can view groups even on free plan
        // They just can't create/modify them
        
        const supabase = getServiceClient(env);
        
        // Check if word_groups table exists
        try {
            const { data, error } = await supabase
                .from("word_groups")
                .select("id, name, created_at")
                .eq("user_id", userId)
                .order("created_at", { ascending: false });
            
            if (error) {
                // Table might not exist yet
                if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
                    return json({ groups: [] });
                }
                return jsonError(500, "db_error", error.message);
            }
            return json({ groups: data || [] });
        } catch (e: any) {
            // Table doesn't exist, return empty array
            if (e.message?.includes("does not exist") || e.message?.includes("schema cache")) {
                return json({ groups: [] });
            }
            throw e;
        }
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

export async function handleCreateGroup(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        
        // Check plan permission for CREATE
        const planCheck = await checkPlanLimit(userId, env, "use_groups");
        if (!planCheck.allowed) {
            return jsonError(403, "plan_feature_unavailable", planCheck.message || "Groups not available in your plan");
        }
        
        const body = await request.json().catch(() => ({}));
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        
        if (!name) {
            return jsonError(400, "invalid_request", "'name' is required");
        }

        const supabase = getServiceClient(env);
        
        try {
            const { data, error } = await supabase
                .from("word_groups")
                .insert({ user_id: userId, name })
                .select("id, name, created_at")
                .single();
            
            if (error) {
                if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
                    return jsonError(400, "feature_not_available", "Groups feature is not set up. Please run the database migration first.");
                }
                return jsonError(500, "db_error", error.message);
            }
            return json({ group: data });
        } catch (e: any) {
            if (e.message?.includes("does not exist") || e.message?.includes("schema cache")) {
                return jsonError(400, "feature_not_available", "Groups feature is not set up. Please run the database migration first.");
            }
            throw e;
        }
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

export async function handleUpdateGroup(request: Request, env: Env, groupId: string): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        
        // Check plan permission for UPDATE
        const planCheck = await checkPlanLimit(userId, env, "use_groups");
        if (!planCheck.allowed) {
            return jsonError(403, "plan_feature_unavailable", planCheck.message || "Groups not available in your plan");
        }
        
        const body = await request.json().catch(() => ({}));
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        
        if (!name) {
            return jsonError(400, "invalid_request", "'name' is required");
        }

        const supabase = getServiceClient(env);
        
        try {
            // Verify group belongs to user
            const { data: existing, error: checkErr } = await supabase
                .from("word_groups")
                .select("id")
                .eq("id", groupId)
                .eq("user_id", userId)
                .single();
            
            if (checkErr || !existing) {
                return jsonError(404, "not_found", "Group not found");
            }

            const { data, error } = await supabase
                .from("word_groups")
                .update({ name })
                .eq("id", groupId)
                .eq("user_id", userId)
                .select("id, name, created_at")
                .single();
            
            if (error) return jsonError(500, "db_error", error.message);
            return json({ group: data });
        } catch (e: any) {
            if (e.message?.includes("does not exist") || e.message?.includes("schema cache")) {
                return jsonError(400, "feature_not_available", "Groups feature is not set up. Please run the database migration first.");
            }
            throw e;
        }
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

export async function handleDeleteGroup(request: Request, env: Env, groupId: string): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        
        // Check plan permission for DELETE
        const planCheck = await checkPlanLimit(userId, env, "use_groups");
        if (!planCheck.allowed) {
            return jsonError(403, "plan_feature_unavailable", planCheck.message || "Groups not available in your plan");
        }
        
        const supabase = getServiceClient(env);
        
        try {
            // Verify group belongs to user
            const { data: existing, error: checkErr } = await supabase
                .from("word_groups")
                .select("id")
                .eq("id", groupId)
                .eq("user_id", userId)
                .single();
            
            if (checkErr || !existing) {
                return jsonError(404, "not_found", "Group not found");
            }

            // Remove group_id from words in this group (set to null) - only if column exists
            try {
                await supabase
                    .from("words")
                    .update({ group_id: null })
                    .eq("group_id", groupId)
                    .eq("user_id", userId);
            } catch {
                // group_id column might not exist, ignore
            }

            // Delete the group
            const { error } = await supabase
                .from("word_groups")
                .delete()
                .eq("id", groupId)
                .eq("user_id", userId);
            
            if (error) return jsonError(500, "db_error", error.message);
            return json({ success: true });
        } catch (e: any) {
            if (e.message?.includes("does not exist") || e.message?.includes("schema cache")) {
                return jsonError(400, "feature_not_available", "Groups feature is not set up. Please run the database migration first.");
            }
            throw e;
        }
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
