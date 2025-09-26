-- Mock data for profiles and coaches
-- Run these INSERT statements in your Supabase SQL editor

-- OPTION 1: Use existing auth users
-- First, check what user IDs exist in your auth.users table:
-- SELECT id FROM auth.users LIMIT 5;
-- Then replace the UUIDs below with real user IDs from your auth system

-- OPTION 2: Temporarily disable foreign key constraint (for testing only)
-- ALTER TABLE profiles DISABLE TRIGGER ALL;
-- Run the inserts below
-- ALTER TABLE profiles ENABLE TRIGGER ALL;

-- First, insert profiles using real user IDs from your auth system
INSERT INTO profiles (user_id, name, location, handicap, created_at) VALUES
('4dd948a9-01f0-4f2f-a650-91e8d375f1d2', 'Sarah Johnson', 'Pebble Beach, CA', 2, '2024-01-15T10:00:00Z'),
('509c7a94-a6a5-4f87-b458-202d720054df', 'Mike Chen', 'Augusta, GA', 1, '2024-01-20T14:30:00Z'),
('585f8607-d468-4959-8156-4f7a514ba503', 'David Rodriguez', 'Scottsdale, AZ', 3, '2024-02-01T09:15:00Z'),
('733f645a-ba3b-434a-b37c-d8a01b1fefb3', 'Lisa Thompson', 'Orlando, FL', 4, '2024-02-10T16:45:00Z'),
('7f2fae43-9737-4edb-a7e5-3711b2a9d257', 'James Wilson', 'Myrtle Beach, SC', 2, '2024-02-15T11:20:00Z'),
('afbcc2d1-9cdd-4566-9ee4-aa7cc667cbf1', 'Maria Garcia', 'San Diego, CA', 5, '2024-02-20T13:10:00Z'),
('e68ab313-2937-441e-b3f4-4fbbd2d77c19', 'Robert Brown', 'Pinehurst, NC', 1, '2024-02-25T08:30:00Z'),
('ed5a52fe-8474-4d41-ba3d-9d2c676a7ac8', 'Jennifer Davis', 'Phoenix, AZ', 3, '2024-03-01T15:45:00Z');

-- Then, insert coaches (only some profiles become coaches)
-- Using subqueries to get the auto-generated profile IDs
INSERT INTO coaches (profile_id, bio, created_at) VALUES
((SELECT id FROM profiles WHERE user_id = '4dd948a9-01f0-4f2f-a650-91e8d375f1d2'), 'PGA Certified instructor with 15 years of experience. Specializing in swing mechanics and short game. Former college golfer and current club professional at Pebble Beach Golf Links.', '2024-01-16T10:00:00Z'),
((SELECT id FROM profiles WHERE user_id = '509c7a94-a6a5-4f87-b458-202d720054df'), 'USGTF Certified teaching professional. Expert in course management and mental game. Helped over 500 students lower their handicaps. Available for both individual and group lessons.', '2024-01-21T14:30:00Z'),
((SELECT id FROM profiles WHERE user_id = '585f8607-d468-4959-8156-4f7a514ba503'), 'LPGA Teaching Professional with 12 years experience. Specializes in women''s golf instruction and junior development. Former Symetra Tour player with a passion for growing the game.', '2024-02-02T09:15:00Z'),
((SELECT id FROM profiles WHERE user_id = '733f645a-ba3b-434a-b37c-d8a01b1fefb3'), 'PGA Master Professional with 20+ years teaching experience. Expert in golf fitness and injury prevention. Certified in TrackMan and other modern teaching technologies.', '2024-02-11T16:45:00Z'),
((SELECT id FROM profiles WHERE user_id = '7f2fae43-9737-4edb-a7e5-3711b2a9d257'), 'Former PGA Tour caddie turned instructor. Specializes in course strategy and putting. Known for helping players break 80 for the first time. Available for on-course lessons.', '2024-02-16T11:20:00Z'),
((SELECT id FROM profiles WHERE user_id = 'e68ab313-2937-441e-b3f4-4fbbd2d77c19'), 'PGA Certified instructor and former mini-tour player. Expert in swing analysis and club fitting. Uses video analysis and launch monitor technology to improve your game.', '2024-02-26T08:30:00Z');

-- Insert coach availabilities using subqueries to get auto-generated coach IDs
INSERT INTO coach_availabilities (coach_id, day_of_week, start_time, end_time, created_at, updated_at) VALUES
-- Sarah Johnson - Pebble Beach, CA
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '4dd948a9-01f0-4f2f-a650-91e8d375f1d2')), 1, '09:00:00', '17:00:00', '2024-01-16T10:00:00Z', '2024-01-16T10:00:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '4dd948a9-01f0-4f2f-a650-91e8d375f1d2')), 2, '09:00:00', '17:00:00', '2024-01-16T10:00:00Z', '2024-01-16T10:00:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '4dd948a9-01f0-4f2f-a650-91e8d375f1d2')), 3, '09:00:00', '17:00:00', '2024-01-16T10:00:00Z', '2024-01-16T10:00:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '4dd948a9-01f0-4f2f-a650-91e8d375f1d2')), 4, '09:00:00', '17:00:00', '2024-01-16T10:00:00Z', '2024-01-16T10:00:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '4dd948a9-01f0-4f2f-a650-91e8d375f1d2')), 5, '09:00:00', '17:00:00', '2024-01-16T10:00:00Z', '2024-01-16T10:00:00Z'),

-- Mike Chen - Augusta, GA
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '509c7a94-a6a5-4f87-b458-202d720054df')), 1, '08:00:00', '16:00:00', '2024-01-21T14:30:00Z', '2024-01-21T14:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '509c7a94-a6a5-4f87-b458-202d720054df')), 2, '08:00:00', '16:00:00', '2024-01-21T14:30:00Z', '2024-01-21T14:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '509c7a94-a6a5-4f87-b458-202d720054df')), 3, '08:00:00', '16:00:00', '2024-01-21T14:30:00Z', '2024-01-21T14:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '509c7a94-a6a5-4f87-b458-202d720054df')), 4, '08:00:00', '16:00:00', '2024-01-21T14:30:00Z', '2024-01-21T14:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '509c7a94-a6a5-4f87-b458-202d720054df')), 5, '08:00:00', '16:00:00', '2024-01-21T14:30:00Z', '2024-01-21T14:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '509c7a94-a6a5-4f87-b458-202d720054df')), 6, '10:00:00', '14:00:00', '2024-01-21T14:30:00Z', '2024-01-21T14:30:00Z'),

-- David Rodriguez - Scottsdale, AZ
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '585f8607-d468-4959-8156-4f7a514ba503')), 1, '07:00:00', '11:00:00', '2024-02-02T09:15:00Z', '2024-02-02T09:15:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '585f8607-d468-4959-8156-4f7a514ba503')), 1, '15:00:00', '19:00:00', '2024-02-02T09:15:00Z', '2024-02-02T09:15:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '585f8607-d468-4959-8156-4f7a514ba503')), 3, '07:00:00', '11:00:00', '2024-02-02T09:15:00Z', '2024-02-02T09:15:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '585f8607-d468-4959-8156-4f7a514ba503')), 3, '15:00:00', '19:00:00', '2024-02-02T09:15:00Z', '2024-02-02T09:15:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '585f8607-d468-4959-8156-4f7a514ba503')), 5, '07:00:00', '11:00:00', '2024-02-02T09:15:00Z', '2024-02-02T09:15:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '585f8607-d468-4959-8156-4f7a514ba503')), 5, '15:00:00', '19:00:00', '2024-02-02T09:15:00Z', '2024-02-02T09:15:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '585f8607-d468-4959-8156-4f7a514ba503')), 0, '08:00:00', '12:00:00', '2024-02-02T09:15:00Z', '2024-02-02T09:15:00Z'),

-- Lisa Thompson - Orlando, FL
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '733f645a-ba3b-434a-b37c-d8a01b1fefb3')), 2, '10:00:00', '18:00:00', '2024-02-11T16:45:00Z', '2024-02-11T16:45:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '733f645a-ba3b-434a-b37c-d8a01b1fefb3')), 4, '10:00:00', '18:00:00', '2024-02-11T16:45:00Z', '2024-02-11T16:45:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '733f645a-ba3b-434a-b37c-d8a01b1fefb3')), 6, '09:00:00', '15:00:00', '2024-02-11T16:45:00Z', '2024-02-11T16:45:00Z'),

-- James Wilson - Myrtle Beach, SC
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '7f2fae43-9737-4edb-a7e5-3711b2a9d257')), 1, '06:00:00', '14:00:00', '2024-02-16T11:20:00Z', '2024-02-16T11:20:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '7f2fae43-9737-4edb-a7e5-3711b2a9d257')), 3, '06:00:00', '14:00:00', '2024-02-16T11:20:00Z', '2024-02-16T11:20:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '7f2fae43-9737-4edb-a7e5-3711b2a9d257')), 5, '06:00:00', '14:00:00', '2024-02-16T11:20:00Z', '2024-02-16T11:20:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = '7f2fae43-9737-4edb-a7e5-3711b2a9d257')), 0, '08:00:00', '12:00:00', '2024-02-16T11:20:00Z', '2024-02-16T11:20:00Z'),

-- Robert Brown - Pinehurst, NC
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = 'e68ab313-2937-441e-b3f4-4fbbd2d77c19')), 1, '09:00:00', '17:00:00', '2024-02-26T08:30:00Z', '2024-02-26T08:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = 'e68ab313-2937-441e-b3f4-4fbbd2d77c19')), 2, '09:00:00', '17:00:00', '2024-02-26T08:30:00Z', '2024-02-26T08:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = 'e68ab313-2937-441e-b3f4-4fbbd2d77c19')), 3, '09:00:00', '17:00:00', '2024-02-26T08:30:00Z', '2024-02-26T08:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = 'e68ab313-2937-441e-b3f4-4fbbd2d77c19')), 4, '09:00:00', '17:00:00', '2024-02-26T08:30:00Z', '2024-02-26T08:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = 'e68ab313-2937-441e-b3f4-4fbbd2d77c19')), 5, '09:00:00', '17:00:00', '2024-02-26T08:30:00Z', '2024-02-26T08:30:00Z'),
((SELECT id FROM coaches WHERE profile_id = (SELECT id FROM profiles WHERE user_id = 'e68ab313-2937-441e-b3f4-4fbbd2d77c19')), 6, '10:00:00', '16:00:00', '2024-02-26T08:30:00Z', '2024-02-26T08:30:00Z');
