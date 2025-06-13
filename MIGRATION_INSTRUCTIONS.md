# Database Migration Instructions

## Issue
The `profiles` table doesn't exist in your Supabase database, causing the application to fail when trying to fetch user profiles.

## Solution
You need to manually apply the migration to create the profiles table. Follow these steps:

### Step 1: Access Supabase SQL Editor
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to the "SQL Editor" in the left sidebar

### Step 2: Execute the Migration
Copy and paste the following SQL code into the SQL Editor and click "Run":

```sql
/*
  # Create profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `first_name` (text)
      - `last_name` (text)
      - `display_name` (text)
      - `bio` (text)
      - `date_of_birth` (date)
      - `gender` (text)
      - `location` (text)
      - `avatar_url` (text)
      - `cover_url` (text)
      - `interests` (text array)
      - `is_profile_complete` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for users to read/write their own profile
    - Add policy for users to read other profiles (public data)

  3. Functions
    - Auto-create profile when user signs up
    - Update timestamp on profile changes
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text,
  last_name text,
  display_name text,
  bio text DEFAULT '',
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  location text,
  avatar_url text,
  cover_url text,
  interests text[] DEFAULT '{}',
  is_profile_complete boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read other profiles (public data)"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Create Storage Bucket (Optional)
If you plan to use avatar uploads, also create a storage bucket:

1. Go to "Storage" in the left sidebar
2. Click "Create a new bucket"
3. Name it `profiles`
4. Make it public if you want avatars to be publicly accessible

### Step 4: Configure Authentication Settings
To fix OTP issues:

1. Go to "Authentication" > "Settings" in your Supabase dashboard
2. Under "Auth Providers", ensure Email is enabled
3. Under "Email Templates", you can customize the OTP email template
4. Check "Rate Limiting" settings to ensure they're not too restrictive

## Verification
After running the migration:
1. Refresh your application
2. Try signing up with a new account
3. The profile should be created automatically
4. No more "relation does not exist" errors should appear

## Troubleshooting
- If you still see errors, check the Supabase logs in the dashboard
- Ensure your environment variables in `.env.local` are correct
- Try clearing your browser cache and localStorage