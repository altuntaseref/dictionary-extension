import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";
import { getServiceClient } from "../services/supabase";
import { generateMeaning } from "../services/llm";

export async function handleTranslate(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        const body = await request.json().catch(() => ({}));
        const word = typeof body?.word === "string" ? body.word.trim() : "";
        const sourceLang = typeof body?.source_lang === "string" ? body.source_lang.trim() : undefined;
        const targetLang = typeof body?.target_lang === "string" ? body.target_lang.trim() : undefined;
        if (!word) {
            return jsonError(400, "invalid_request", "'word' is required");
        }

        const meaning = await generateMeaning(word, env, { sourceLang, targetLang });
        const supabase = getServiceClient(env);
        const { error } = await supabase.from("words").insert({
            user_id: userId,
            word,
            meaning,
        });
        if (error) {
            return jsonError(500, "db_error", error.message);
        }
        return json({ word, meaning });
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


