import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";
import { checkPlanLimit } from "../middleware/planCheck";
import { getServiceClient, type WordRow } from "../services/supabase";
import { toCsv } from "../services/formatter";

export async function handleExport(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        
        // Check plan permission
        const planCheck = await checkPlanLimit(userId, env, "export");
        if (!planCheck.allowed) {
            return jsonError(403, "plan_feature_unavailable", planCheck.message || "Export not available in your plan");
        }
        
        const url = new URL(request.url);
        const format = (url.searchParams.get("format") || "json").toLowerCase();
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

        if (format === "csv") {
            const csv = toCsv((data || []) as WordRow[]);
            return new Response(csv, {
                status: 200,
                headers: {
                    "content-type": "text/csv; charset=utf-8",
                    "content-disposition": `attachment; filename=words${groupId ? `_group_${groupId}` : ''}.csv`,
                },
            });
        }
        if (format !== "json") {
            return jsonError(400, "invalid_format", "format must be 'json' or 'csv'");
        }
        return json({ words: data || [] });
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
