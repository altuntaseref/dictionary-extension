import type { Env } from "../index";
import { requireAuth, type AuthContext } from "./auth";
import { getUserPlan, getUserWordCount, type UserPlan } from "../services/plans";

export interface PlanContext extends AuthContext {
    plan: UserPlan;
    wordCount: number;
}

export async function requirePlan(request: Request, env: Env): Promise<PlanContext> {
    const auth = await requireAuth(request, env);
    const plan = await getUserPlan(auth.userId, env);
    const wordCount = await getUserWordCount(auth.userId, env);
    
    return {
        ...auth,
        plan,
        wordCount,
    };
}

export async function checkPlanLimit(
    userId: string,
    env: Env,
    action: "add_word" | "export" | "use_groups" | "access_exercises"
): Promise<{ allowed: boolean; message?: string }> {
    const plan = await getUserPlan(userId, env);
    const wordCount = await getUserWordCount(userId, env);
    
    if (action === "add_word") {
        if (wordCount >= plan.max_words) {
            return {
                allowed: false,
                message: `You have reached your plan limit of ${plan.max_words} words. Please upgrade to add more words.`,
            };
        }
    }
    
    if (action === "export") {
        if (!plan.can_export) {
            return {
                allowed: false,
                message: "Export is not available in your current plan. Please upgrade to Pro plan.",
            };
        }
    }
    
    if (action === "use_groups") {
        if (!plan.can_use_groups) {
            return {
                allowed: false,
                message: "Groups feature is not available in your current plan. Please upgrade to Pro plan.",
            };
        }
    }
    
    if (action === "access_exercises") {
        if (!plan.can_access_exercises) {
            return {
                allowed: false,
                message: "Exercises feature is not available in your current plan. Please upgrade to Pro+ plan.",
            };
        }
    }
    
    return { allowed: true };
}
