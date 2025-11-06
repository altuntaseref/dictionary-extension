import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";
import { getServiceClient, type WordRow } from "../services/supabase";
import { toCsv } from "../services/formatter";

export async function handleExport(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        const url = new URL(request.url);
        const format = (url.searchParams.get("format") || "json").toLowerCase();

        const supabase = getServiceClient(env);
        const { data, error } = await supabase
            .from("words")
            .select("id, user_id, word, meaning, examples, notes, created_at")
            .eq("user_id", userId)
            .order("created_at", { ascending: true });
        if (error) return jsonError(500, "db_error", error.message);

        if (format === "csv") {
            const csv = toCsv((data || []) as WordRow[]);
            return new Response(csv, {
                status: 200,
                headers: {
                    "content-type": "text/csv; charset=utf-8",
                    "content-disposition": `attachment; filename=words.csv`,
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


