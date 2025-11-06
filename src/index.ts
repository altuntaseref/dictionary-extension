export interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    OPENAI_API_KEY?: string;
    ANTHROPIC_API_KEY?: string;
}

type Handler = (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response> | Response;

function json(data: unknown, init: ResponseInit = {}): Response {
    const headers = new Headers(init.headers);
    headers.set("content-type", "application/json; charset=utf-8");
    return new Response(JSON.stringify(data), { ...init, headers });
}

function cors(init: ResponseInit = {}): Headers {
    const headers = new Headers(init.headers);
    headers.set("access-control-allow-origin", "*");
    headers.set("access-control-allow-headers", "authorization, content-type");
    headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
    return headers;
}

function withCors(handler: Handler): Handler {
    return async (request, env, ctx) => {
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: cors() });
        }
        const res = await handler(request, env, ctx);
        const headers = new Headers(res.headers);
        headers.set("access-control-allow-origin", "*");
        headers.set("access-control-allow-headers", "authorization, content-type");
        headers.set("access-control-allow-methods", "GET, POST, OPTIONS");
        if (!headers.has("content-type")) {
            headers.set("content-type", "application/json; charset=utf-8");
        }
        return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    };
}

// Lazy imports to avoid circulars in Worker init
async function route(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/" || path === "/api/health") {
        return json({ ok: true });
    }

    if (path === "/api/translate" && request.method === "POST") {
        const { handleTranslate } = await import("./controllers/translate");
        return handleTranslate(request, env, ctx);
    }

    if (path === "/api/example" && request.method === "POST") {
        const { handleExample } = await import("./controllers/example");
        return handleExample(request, env, ctx);
    }

    if (path === "/api/export" && request.method === "GET") {
        const { handleExport } = await import("./controllers/export");
        return handleExport(request, env, ctx);
    }

    return json({ error: { code: "not_found", message: "Route not found" } }, { status: 404 });
}

export default {
    fetch: (request: Request, env: Env, ctx: ExecutionContext) => withCors(route)(request, env, ctx),
};


