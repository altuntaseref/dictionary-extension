-- Create word_groups table
CREATE TABLE IF NOT EXISTS word_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Add group_id column to words table
ALTER TABLE words ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES word_groups(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_word_groups_user_id ON word_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_words_group_id ON words(group_id);

-- Enable Row Level Security
ALTER TABLE word_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Users can view their own groups" ON word_groups;
DROP POLICY IF EXISTS "Users can create their own groups" ON word_groups;
DROP POLICY IF EXISTS "Users can update their own groups" ON word_groups;
DROP POLICY IF EXISTS "Users can delete their own groups" ON word_groups;

-- RLS Policies for word_groups
CREATE POLICY "Users can view their own groups"
    ON word_groups FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups"
    ON word_groups FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
    ON word_groups FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
    ON word_groups FOR DELETE
    USING (auth.uid() = user_id);

