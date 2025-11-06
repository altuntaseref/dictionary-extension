import type { Env } from "../index";

export interface AuthContext {
    userId: string;
}

export async function requireAuth(request: Request, env: Env): Promise<AuthContext> {
    const auth = request.headers.get("authorization") || request.headers.get("Authorization");
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
        throw unauthorized("Missing Bearer token");
    }
    const token = auth.slice("bearer ".length).trim();
    const userId = await verifyJwtAndGetUserId(token, env);
    return { userId };
}

function unauthorized(message: string): Response {
    return new Response(JSON.stringify({ error: { code: "unauthorized", message } }), {
        status: 401,
        headers: { "content-type": "application/json; charset=utf-8" },
    });
}

async function verifyJwtAndGetUserId(jwt: string, env: Env): Promise<string> {
    const url = `${env.SUPABASE_URL}/auth/v1/user`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${jwt}`,
            apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        },
    });
    if (res.status === 401 || res.status === 403) {
        throw unauthorized("Invalid token");
    }
    if (!res.ok) {
        throw new Response(JSON.stringify({ error: { code: "auth_error", message: "Auth service error" } }), {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" },
        });
    }
    const data = await res.json();
    if (!data?.id) {
        throw unauthorized("Invalid user");
    }
    return data.id as string;
}


