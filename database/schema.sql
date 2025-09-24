-- Create profile table
CREATE TABLE IF NOT EXISTS profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  handicap INTEGER NOT NULL
);

-- Create an index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_name ON profile(name);

-- Create an index on location for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_location ON profile(location);

-- Create an index on handicap for faster lookups
CREATE INDEX IF NOT EXISTS idx_profile_handicap ON profile(handicap);

-- Enable Row Level Security (RLS)
ALTER TABLE profile ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (adjust based on your authentication needs)
-- For now, we'll allow all operations for authenticated users
-- You may want to restrict this based on your requirements

-- Policy for SELECT operations
CREATE POLICY "Allow authenticated users to view all profiles" ON profile
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for INSERT operations
CREATE POLICY "Allow authenticated users to insert profiles" ON profile
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for UPDATE operations
CREATE POLICY "Allow authenticated users to update profiles" ON profile
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for DELETE operations
CREATE POLICY "Allow authenticated users to delete profiles" ON profile
    FOR DELETE USING (auth.role() = 'authenticated');

-- If you want to allow service role to bypass RLS (for server-side operations)
-- You can add this policy:
CREATE POLICY "Allow service role full access" ON profile
    FOR ALL USING (auth.role() = 'service_role');
