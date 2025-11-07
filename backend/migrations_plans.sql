-- Create plans table (free, pro, pro+)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- 'free', 'pro', 'pro_plus'
    display_name TEXT NOT NULL,
    max_words INTEGER NOT NULL DEFAULT 10,
    can_export BOOLEAN NOT NULL DEFAULT false,
    can_use_groups BOOLEAN NOT NULL DEFAULT false,
    can_access_exercises BOOLEAN NOT NULL DEFAULT false,
    price DECIMAL(10, 2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add can_access_exercises column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'plans' AND column_name = 'can_access_exercises') THEN
        ALTER TABLE plans ADD COLUMN can_access_exercises BOOLEAN NOT NULL DEFAULT false;
    END IF;
    
    -- Add price column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'plans' AND column_name = 'price') THEN
        ALTER TABLE plans ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00;
    END IF;
    
    -- Add currency column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'plans' AND column_name = 'currency') THEN
        ALTER TABLE plans ADD COLUMN currency TEXT DEFAULT 'USD';
    END IF;
END $$;

-- Create user_plans table (user subscriptions)
CREATE TABLE IF NOT EXISTS user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL for lifetime plans
    UNIQUE(user_id)
);

-- Create plan_features table for flexible feature management
CREATE TABLE IF NOT EXISTS plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    feature_key TEXT NOT NULL, -- 'max_words', 'can_export', 'can_use_groups', etc.
    feature_value TEXT NOT NULL, -- JSON string or simple value
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(plan_id, feature_key)
);

-- Create user_roles table for admin access
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'admin', 'moderator', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Insert default plans (update existing ones)
INSERT INTO plans (name, display_name, max_words, can_export, can_use_groups, can_access_exercises, price, currency) VALUES
    ('free', 'Free Plan', 10, false, false, false, 0.00, 'USD'),
    ('pro', 'Pro Plan', 200, true, true, false, 9.99, 'USD'),
    ('pro_plus', 'Pro+ Plan', 1000, true, true, true, 19.99, 'USD')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    max_words = EXCLUDED.max_words,
    can_export = EXCLUDED.can_export,
    can_use_groups = EXCLUDED.can_use_groups,
    can_access_exercises = EXCLUDED.can_access_exercises,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_plan_id ON user_plans(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_plan_id ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Enable Row Level Security
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view plans" ON plans;
DROP POLICY IF EXISTS "Users can view their own plan" ON user_plans;
DROP POLICY IF EXISTS "Anyone can view plan features" ON plan_features;
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;

-- RLS Policies for plans (public read)
CREATE POLICY "Anyone can view plans"
    ON plans FOR SELECT
    USING (true);

-- RLS Policies for user_plans
CREATE POLICY "Users can view their own plan"
    ON user_plans FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policies for plan_features (public read)
CREATE POLICY "Anyone can view plan features"
    ON plan_features FOR SELECT
    USING (true);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Drop existing function if it exists (to avoid return type conflicts)
DROP FUNCTION IF EXISTS get_user_plan(UUID);

-- Function to get user's current plan (defaults to 'free' if none assigned)
CREATE OR REPLACE FUNCTION get_user_plan(user_uuid UUID)
RETURNS TABLE (
    plan_id UUID,
    plan_name TEXT,
    display_name TEXT,
    max_words INTEGER,
    can_export BOOLEAN,
    can_use_groups BOOLEAN,
    can_access_exercises BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.display_name,
        p.max_words,
        p.can_export,
        p.can_use_groups,
        p.can_access_exercises
    FROM user_plans up
    JOIN plans p ON up.plan_id = p.id
    WHERE up.user_id = user_uuid
        AND (up.expires_at IS NULL OR up.expires_at > NOW())
    LIMIT 1;
    
    -- If no plan found, return free plan
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            p.id,
            p.name,
            p.display_name,
            p.max_words,
            p.can_export,
            p.can_use_groups,
            p.can_access_exercises
        FROM plans p
        WHERE p.name = 'free'
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
