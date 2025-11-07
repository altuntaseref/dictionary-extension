import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";
import { checkUserRole } from "../services/plans";
import { getUserWordCount, getUserExampleCount } from "../services/plans";
import { getServiceClient } from "../services/supabase";

async function requireAdmin(userId: string, env: Env): Promise<void> {
    const isAdmin = await checkUserRole(userId, env, "admin");
    if (!isAdmin) {
        throw new Response(
            JSON.stringify({ error: { code: "forbidden", message: "Admin access required" } }),
            { status: 403, headers: { "content-type": "application/json" } }
        );
    }
}

export async function handleGetPlans(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        await requireAdmin(userId, env);
        
        const supabase = getServiceClient(env);
        const { data, error } = await supabase
            .from("plans")
            .select("id, name, display_name, max_words, can_export, can_use_groups, can_access_exercises, price, currency, created_at")
            .order("name");
        
        if (error) {
            if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
                return json({ plans: [] });
            }
            return jsonError(500, "db_error", error.message);
        }
        
        return json({ plans: data || [] });
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

export async function handleUpdatePlan(request: Request, env: Env, planId: string): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        await requireAdmin(userId, env);
        
        const body = await request.json().catch(() => ({}));
        const updates: any = {};
        
        if (typeof body.display_name === "string") updates.display_name = body.display_name.trim();
        if (typeof body.max_words === "number") updates.max_words = body.max_words;
        if (typeof body.can_export === "boolean") updates.can_export = body.can_export;
        if (typeof body.can_use_groups === "boolean") updates.can_use_groups = body.can_use_groups;
        if (typeof body.can_access_exercises === "boolean") updates.can_access_exercises = body.can_access_exercises;
        if (typeof body.price === "number") updates.price = body.price;
        if (typeof body.currency === "string") updates.currency = body.currency.trim();
        
        const supabase = getServiceClient(env);
        const { data, error } = await supabase
            .from("plans")
            .update(updates)
            .eq("id", planId)
            .select("id, name, display_name, max_words, can_export, can_use_groups, can_access_exercises, price, currency, created_at")
            .single();
        
        if (error) {
            if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
                return jsonError(400, "feature_not_available", "Plans feature is not set up. Please run the database migration first.");
            }
            return jsonError(500, "db_error", error.message);
        }
        
        return json({ plan: data });
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

export async function handleGetUsers(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        await requireAdmin(userId, env);
        
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "50");
        
        const supabase = getServiceClient(env);

        const adminRes = await fetch(`${env.SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=${limit}`, {
            headers: {
                Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
                apikey: env.SUPABASE_SERVICE_ROLE_KEY,
            },
        });

        if (!adminRes.ok) {
            const text = await adminRes.text();
            return jsonError(500, "auth_error", text || "Failed to fetch users");
        }

        const adminData = await adminRes.json();
        const authUsers = adminData.users || [];
        const totalUsers = adminData.total ?? authUsers.length;

        if (authUsers.length === 0) {
            return json({ users: [], total: totalUsers, page, limit });
        }

        const userIds = authUsers.map((user: any) => user.id);

        const { data: userPlans } = await supabase
            .from("user_plans")
            .select(`
                user_id,
                plan_id,
                created_at as plan_created_at,
                expires_at,
                plans:id,plans:name,plans:display_name
            `)
            .in("user_id", userIds);

        const planMap = new Map();
        if (userPlans) {
            for (const up of userPlans) {
                planMap.set(up.user_id, up);
            }
        }

        const usersWithStats = await Promise.all(
            authUsers.map(async (user: any) => {
                const wordCount = await getUserWordCount(user.id, env);
                const exampleCount = await getUserExampleCount(user.id, env);
                const userPlan = planMap.get(user.id);

                return {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                    last_sign_in_at: user.last_sign_in_at,
                    word_count: wordCount,
                    example_count: exampleCount,
                    plan: userPlan ? {
                        id: userPlan.plan_id,
                        name: userPlan.plans?.name || 'free',
                        display_name: userPlan.plans?.display_name || 'Free Plan',
                        plan_created_at: userPlan.plan_created_at,
                        expires_at: userPlan.expires_at,
                    } : {
                        id: null,
                        name: 'free',
                        display_name: 'Free Plan',
                        plan_created_at: null,
                        expires_at: null,
                    },
                };
            })
        );

        return json({
            users: usersWithStats,
            total: totalUsers,
            page,
            limit,
        });
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

export async function handleAssignPlan(request: Request, env: Env): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        await requireAdmin(userId, env);
        
        const body = await request.json().catch(() => ({}));
        const targetUserId = typeof body.user_id === "string" ? body.user_id.trim() : "";
        const planId = typeof body.plan_id === "string" ? body.plan_id.trim() : "";
        const expiresAt = body.expires_at ? new Date(body.expires_at).toISOString() : null;
        
        if (!targetUserId || !planId) {
            return jsonError(400, "invalid_request", "'user_id' and 'plan_id' are required");
        }
        
        const supabase = getServiceClient(env);
        
        // Check if plan exists
        const { data: plan, error: planErr } = await supabase
            .from("plans")
            .select("id")
            .eq("id", planId)
            .single();
        
        if (planErr || !plan) {
            return jsonError(404, "not_found", "Plan not found");
        }
        
        // Upsert user plan
        const { data, error } = await supabase
            .from("user_plans")
            .upsert({
                user_id: targetUserId,
                plan_id: planId,
                expires_at: expiresAt,
            }, {
                onConflict: "user_id",
            })
            .select(`
                user_id,
                plan_id,
                created_at,
                expires_at,
                plans:id,plans:name,plans:display_name
            `)
            .single();
        
        if (error) {
            if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
                return jsonError(400, "feature_not_available", "Plans feature is not set up. Please run the database migration first.");
            }
            return jsonError(500, "db_error", error.message);
        }
        
        return json({ user_plan: data });
    } catch (e: any) {
        if (e instanceof Response) return e;
        return jsonError(500, "internal_error", e?.message || "Unexpected error");
    }
}

export async function handleGetUserPlan(request: Request, env: Env, targetUserId: string): Promise<Response> {
    try {
        const { userId } = await requireAuth(request, env);
        await requireAdmin(userId, env);
        
        const supabase = getServiceClient(env);
        const { data, error } = await supabase
            .from("user_plans")
            .select(`
                user_id,
                plan_id,
                created_at,
                expires_at,
                plans:id,plans:name,plans:display_name,plans:max_words,plans:can_export,plans:can_use_groups,plans:can_access_exercises
            `)
            .eq("user_id", targetUserId)
            .maybeSingle();
        
        if (error) {
            if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
                return json({ user_plan: null });
            }
            return jsonError(500, "db_error", error.message);
        }
        
        return json({ user_plan: data });
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
