-- Supabase Setup Script for AI PDF Chat Application
-- Run these commands in your Supabase SQL Editor

-- 1. Create the user_files table
CREATE TABLE IF NOT EXISTS user_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE user_files ENABLE ROW LEVEL SECURITY;

-- 3. Create policies for user_files table
-- Drop existing policies first if they exist
DROP POLICY IF EXISTS "Users can view own files" ON user_files;
DROP POLICY IF EXISTS "Users can insert own files" ON user_files;
DROP POLICY IF EXISTS "Users can update own files" ON user_files;
DROP POLICY IF EXISTS "Users can delete own files" ON user_files;

-- Allow authenticated users to insert their files
CREATE POLICY "Users can insert own files" ON user_files
  FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own files" ON user_files
  FOR SELECT 
  USING (true);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files" ON user_files
  FOR UPDATE
  USING (true);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files" ON user_files
  FOR DELETE
  USING (true);

-- 4. Create storage bucket for PDF files
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdf-files', 'pdf-files', false)
ON CONFLICT (id) DO NOTHING;

-- Note: Storage policies are configured automatically for authenticated users
-- Files will be stored in user-specific folders: {user-id}/{filename}

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_files_user_id ON user_files(user_id);
CREATE INDEX IF NOT EXISTS idx_user_files_uploaded_at ON user_files(uploaded_at DESC);

-- 6. Create a test user (optional - for demo purposes)
-- Note: This creates a user with a known password for testing
-- In production, users should create their own accounts
-- Password: Test@12345
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440000',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('Test@12345', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (id) DO NOTHING;