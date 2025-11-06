import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";
import { getServiceClient } from "../services/supabase";
import { generateExamples } from "../services/llm";

export async function handleExample(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        const body = await request.json().catch(() => ({}));
        const word = typeof body?.word === "string" ? body.word.trim() : "";
        const targetLang = typeof body?.target_lang === "string" ? body.target_lang.trim() : undefined;
        if (!word) {
            return jsonError(400, "invalid_request", "'word' is required");
        }

        const supabase = getServiceClient(env);
        const { data, error: findErr } = await supabase
            .from("words")
            .select("id, examples")
            .eq("user_id", userId)
            .eq("word", word)
            .limit(1)
            .maybeSingle();
        if (findErr) return jsonError(500, "db_error", findErr.message);
        if (!data) return jsonError(404, "not_found", "Word not found");

        const examples = await generateExamples(word, env, { targetLang });
        const merged = Array.isArray(data.examples) ? [...data.examples, ...examples] : examples;
        const { error: updErr } = await supabase
            .from("words")
            .update({ examples: merged })
            .eq("id", data.id)
            .eq("user_id", userId);
        if (updErr) return jsonError(500, "db_error", updErr.message);

        return json({ examples });
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


