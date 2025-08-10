-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create children table
CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    age TEXT NOT NULL,
    grade TEXT,
    goals TEXT[] DEFAULT '{}',
    curriculum_types TEXT[] DEFAULT '{}',
    notes TEXT,
    color TEXT DEFAULT 'bg-purple-200',
    emoji TEXT DEFAULT '🦄',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    child_id UUID REFERENCES children(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    day TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    materials TEXT[] DEFAULT '{}',
    instructions TEXT[] DEFAULT '{}',
    objectives TEXT[] DEFAULT '{}',
    enhanced BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    completed_at TIMESTAMPTZ,
    recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT CHECK (recurrence_rule IN ('weekly', 'biweekly', 'monthly', NULL)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create saved_plans table
CREATE TABLE saved_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    activities JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_children_user_id ON children(user_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_child_id ON activities(child_id);
CREATE INDEX idx_saved_plans_user_id ON saved_plans(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_plans ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Children policies
CREATE POLICY "Users can view own children" ON children
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own children" ON children
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own children" ON children
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own children" ON children
    FOR DELETE USING (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view own activities" ON activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activities" ON activities
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities" ON activities
    FOR DELETE USING (auth.uid() = user_id);

-- Saved plans policies
CREATE POLICY "Users can view own plans" ON saved_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own plans" ON saved_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON saved_plans
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON saved_plans
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_plans_updated_at BEFORE UPDATE ON saved_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();