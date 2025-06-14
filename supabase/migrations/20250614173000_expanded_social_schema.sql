/*
  # Add Social Accounts, Posts, and Messages tables

  1. New Tables
    - `social_accounts`
      - `id` (uuid, primary key, default uuid_generate_v4())
      - `profile_id` (uuid, references profiles)
      - `provider` (text)
      - `account_url` (text)
      - `verified` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `posts`
      - `id` (uuid, primary key, default uuid_generate_v4())
      - `profile_id` (uuid, references profiles)
      - `title` (text)
      - `content` (text)
      - `media_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `messages`
      - `id` (uuid, primary key, default uuid_generate_v4())
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `content` (text)
      - `read` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Policies for users to manage their own records
    - Allow reading public posts and profiles

  3. Functions
    - Update timestamp on changes for tables with `updated_at`
*/

-- Social Accounts table
CREATE TABLE IF NOT EXISTS social_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  provider text CHECK (provider IN ('instagram', 'facebook', 'linkedin', 'twitter', 'google')),
  account_url text NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, provider)
);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text,
  content text,
  media_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Social Accounts policies
CREATE POLICY "Users can read social accounts" ON social_accounts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own social accounts" ON social_accounts
  FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Posts policies
CREATE POLICY "Users can read posts" ON posts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own posts" ON posts
  FOR ALL TO authenticated USING (auth.uid() = profile_id) WITH CHECK (auth.uid() = profile_id);

-- Messages policies
CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on social_accounts changes
DROP TRIGGER IF EXISTS update_social_accounts_updated_at ON social_accounts;
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on posts changes
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
