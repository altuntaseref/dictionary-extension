import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";
import { getUserPlan, getUserWordCount } from "../services/plans";

export async function handleGetUserPlanInfo(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        const plan = await getUserPlan(userId, env);
        const wordCount = await getUserWordCount(userId, env);
        
        return json({
            plan: {
                ...plan,
                word_count: wordCount,
                remaining_words: Math.max(0, plan.max_words - wordCount),
            },
        });
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
