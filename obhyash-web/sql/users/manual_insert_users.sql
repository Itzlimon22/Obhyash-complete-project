-- ==========================================
-- OPTION 1: ADMIN USER
-- ==========================================
INSERT INTO public.users (
    id, 
    email, 
    name, 
    role, -- Critical: Must be 'Admin'
    status, 
    phone,
    gender,
    institute,
    goal, 
    division, 
    batch, 
    xp, 
    level, 
    exams_taken, 
    enrolled_exams,
    subscription,
    avatar_color
)
VALUES (
    'f19ee12b-0c09-40fa-8e34-9cfc6173328a', -- <--- 🔴 REPLACE THIS with the UUID from Auth tab
    'admin@obhyash.com', 
    'Admin User', 
    'Admin', 
    'Active',
    '01700000000',
    'Male',
    'Obhyash HQ',
    'N/A', 
    'N/A', 
    'N/A', 
    0, 
    'Advanced', 
    0, 
    0,
    '{"plan": "Enterprise", "expiry": "2030-12-31", "status": "Active"}'::jsonb,
    '#6366f1'
);

-- ==========================================
-- OPTION 2: STUDENT USER
-- ==========================================
INSERT INTO public.users (
    id, 
    email, 
    name, 
    role, -- Critical: Must be 'Student'
    status,
    phone,
    gender,
    institute,
    goal, 
    division, 
    batch, 
    xp, 
    level, 
    exams_taken, 
    enrolled_exams,
    subscription,
    avatar_color
)
VALUES (
    '552b4410-8ec1-415e-b120-47b97dee7f60', -- <--- 🔴 REPLACE THIS with the UUID from Auth tab
    'student@obhyash.com', 
    'Student User', 
    'Student', 
    'Active', 
    '01800000000',
    'Female',
    'Dhaka College',
    'HSC / Admission', 
    'Science', 
    'HSC 2025', 
    0, 
    'Beginner', 
    0, 
    0,
    '{"plan": "Free", "expiry": "2025-12-31", "status": "Active"}'::jsonb,
    '#10b981'
);
