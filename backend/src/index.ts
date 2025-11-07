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
    headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS");
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
        headers.set("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS");
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

    // Words endpoints - no plan check for listing
    if (path === "/api/words" && request.method === "GET") {
        const { handleGetWords } = await import("./controllers/words");
        return handleGetWords(request, env);
    }

    if (path === "/api/export" && request.method === "GET") {
        const { handleExport } = await import("./controllers/export");
        return handleExport(request, env, ctx);
    }

    if (path === "/api/plans" && request.method === "GET") {
        const { handleListPlans } = await import("./controllers/plans");
        return handleListPlans(request, env);
    }

    // User plan info
    if (path === "/api/user/plan" && request.method === "GET") {
        const { handleGetUserPlanInfo } = await import("./controllers/user");
        return handleGetUserPlanInfo(request, env);
    }

    // Groups endpoints
    if (path === "/api/groups" && request.method === "GET") {
        const { handleGetGroups } = await import("./controllers/groups");
        return handleGetGroups(request, env);
    }

    if (path === "/api/groups" && request.method === "POST") {
        const { handleCreateGroup } = await import("./controllers/groups");
        return handleCreateGroup(request, env);
    }

    // Group update/delete: /api/groups/:id
    const groupMatch = path.match(/^\/api\/groups\/([^\/]+)$/);
    if (groupMatch) {
        const groupId = groupMatch[1];
        if (request.method === "PUT") {
            const { handleUpdateGroup } = await import("./controllers/groups");
            return handleUpdateGroup(request, env, groupId);
        }
        if (request.method === "DELETE") {
            const { handleDeleteGroup } = await import("./controllers/groups");
            return handleDeleteGroup(request, env, groupId);
        }
    }

    // Word group assignment: /api/words/:id/group
    const wordGroupMatch = path.match(/^\/api\/words\/([^\/]+)\/group$/);
    if (wordGroupMatch && request.method === "PUT") {
        const wordId = wordGroupMatch[1];
        const { handleUpdateWordGroup } = await import("./controllers/words");
        return handleUpdateWordGroup(request, env, wordId);
    }

    // Admin endpoints
    if (path === "/api/admin/plans" && request.method === "GET") {
        const { handleGetPlans } = await import("./controllers/admin");
        return handleGetPlans(request, env);
    }

    if (path === "/api/admin/plans" && request.method === "PUT") {
        const { handleUpdatePlan } = await import("./controllers/admin");
        const planId = url.searchParams.get("id");
        if (!planId) {
            return json({ error: { code: "invalid_request", message: "plan id is required" } }, { status: 400 });
        }
        return handleUpdatePlan(request, env, planId);
    }

    // Admin plan update: /api/admin/plans/:id
    const adminPlanMatch = path.match(/^\/api\/admin\/plans\/([^\/]+)$/);
    if (adminPlanMatch && request.method === "PUT") {
        const planId = adminPlanMatch[1];
        const { handleUpdatePlan } = await import("./controllers/admin");
        return handleUpdatePlan(request, env, planId);
    }

    if (path === "/api/admin/users" && request.method === "GET") {
        const { handleGetUsers } = await import("./controllers/admin");
        return handleGetUsers(request, env);
    }

    if (path === "/api/admin/users/assign-plan" && request.method === "POST") {
        const { handleAssignPlan } = await import("./controllers/admin");
        return handleAssignPlan(request, env);
    }

    // Admin user plan: /api/admin/users/:id/plan
    const adminUserPlanMatch = path.match(/^\/api\/admin\/users\/([^\/]+)\/plan$/);
    if (adminUserPlanMatch) {
        const userId = adminUserPlanMatch[1];
        if (request.method === "GET") {
            const { handleGetUserPlan } = await import("./controllers/admin");
            return handleGetUserPlan(request, env, userId);
        }
    }

    return json({ error: { code: "not_found", message: "Route not found" } }, { status: 404 });
}

export default {
    fetch: (request: Request, env: Env, ctx: ExecutionContext) => withCors(route)(request, env, ctx),
};
