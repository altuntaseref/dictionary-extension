import type { Env } from "./supabase";
import { getServiceClient } from "./supabase";

export interface Plan {
    id: string;
    name: string;
    display_name: string;
    max_words: number;
    can_export: boolean;
    can_use_groups: boolean;
    can_access_exercises: boolean;
    price: number;
    currency: string;
}

export interface UserPlan extends Plan {
    expires_at: string | null;
}

export async function getUserPlan(userId: string, env: Env): Promise<UserPlan> {
    const supabase = getServiceClient(env);
    
    // Try to get user's assigned plan
    const { data: userPlan, error } = await supabase
        .from("user_plans")
        .select(`
            plan_id,
            expires_at,
            plans:id,plans:name,plans:display_name,plans:max_words,plans:can_export,plans:can_use_groups,plans:can_access_exercises,plans:price,plans:currency
        `)
        .eq("user_id", userId)
        .is("expires_at", null)
        .maybeSingle();
    
    if (error && !error.message.includes("does not exist")) {
        // If table doesn't exist, return free plan defaults
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
            return {
                id: "free",
                name: "free",
                display_name: "Free Plan",
                max_words: 10,
                can_export: false,
                can_use_groups: false,
                can_access_exercises: false,
                price: 0,
                currency: "USD",
                expires_at: null,
            };
        }
        throw error;
    }
    
    // If user has a plan and it's not expired
    if (userPlan && (!userPlan.expires_at || new Date(userPlan.expires_at) > new Date())) {
        const plan = userPlan.plans;
        if (plan) {
            return {
                id: plan.id,
                name: plan.name,
                display_name: plan.display_name,
                max_words: plan.max_words,
                can_export: plan.can_export,
                can_use_groups: plan.can_use_groups,
                can_access_exercises: plan.can_access_exercises,
                price: plan.price || 0,
                currency: plan.currency || "USD",
                expires_at: userPlan.expires_at,
            };
        }
    }
    
    // Default to free plan
    const { data: freePlan } = await supabase
        .from("plans")
        .select("id, name, display_name, max_words, can_export, can_use_groups, can_access_exercises, price, currency")
        .eq("name", "free")
        .single();
    
    if (freePlan) {
        return {
            ...freePlan,
            price: freePlan.price || 0,
            currency: freePlan.currency || "USD",
            expires_at: null,
        };
    }
    
    // Fallback if plans table doesn't exist
    return {
        id: "free",
        name: "free",
        display_name: "Free Plan",
        max_words: 10,
        can_export: false,
        can_use_groups: false,
        can_access_exercises: false,
        price: 0,
        currency: "USD",
        expires_at: null,
    };
}

export async function getUserWordCount(userId: string, env: Env): Promise<number> {
    const supabase = getServiceClient(env);
    
    try {
        const { count, error } = await supabase
            .from("words")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);
        
        if (error) {
            if (error.message.includes("does not exist")) {
                return 0;
            }
            throw error;
        }
        
        return count || 0;
    } catch (e: any) {
        if (e.message?.includes("does not exist")) {
            return 0;
        }
        throw e;
    }
}

export async function getUserExampleCount(userId: string, env: Env): Promise<number> {
    const supabase = getServiceClient(env);
    
    try {
        const { data: words, error } = await supabase
            .from("words")
            .select("examples")
            .eq("user_id", userId);
        
        if (error) {
            if (error.message.includes("does not exist")) {
                return 0;
            }
            throw error;
        }
        
        let totalExamples = 0;
        if (words) {
            for (const word of words) {
                if (word.examples && Array.isArray(word.examples)) {
                    totalExamples += word.examples.length;
                }
            }
        }
        
        return totalExamples;
    } catch (e: any) {
        if (e.message?.includes("does not exist")) {
            return 0;
        }
        throw e;
    }
}

export async function checkUserRole(userId: string, env: Env, role: string): Promise<boolean> {
    const supabase = getServiceClient(env);
    
    try {
        const { data, error } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", userId)
            .eq("role", role)
            .maybeSingle();
        
        if (error) {
            if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
                return false;
            }
            throw error;
        }
        
        return !!data;
    } catch (e: any) {
        if (e.message?.includes("does not exist") || e.message?.includes("schema cache")) {
            return false;
        }
        throw e;
    }
}
