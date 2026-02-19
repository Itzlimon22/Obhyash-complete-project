import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Middleware should handle this, but double check
    return redirect('/login');
  }

  // Fetch Full Profile including metadata
  // We use the helper from services (which handles 'me' logic or ID)
  // But here we have the ID, so let's fetch directly or use helper if it supports server-side calls well.
  // getUserProfile in services/database.ts might use client-side supabase instance if not careful.
  // "services/database.ts" usually imports "utils/supabase/client" which fails on server?
  // Let's check imports in "services/database.ts".
  // It imports types. It sets up `const supabase = ...` at top level which might be client-side.
  // SAFEST: Fetch raw data here or ensure service is server-safe.
  // Given we refactored code, let's just fetch raw profile here to be safe and pass to Client Component.

  const { data: dbProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!dbProfile && !user) {
    return redirect('/login');
  }

  // Fetch Subjects for History & OMR
  const { data: subjectsData } = await supabase.from('subjects').select('*');
  const subjects = subjectsData || [];

  // Map DB snake_case fields to application camelCase UserProfile interface
  const userProfile = dbProfile
    ? {
        ...dbProfile,
        // Explicitly map mismatched fields
        streakCount: dbProfile.streak || dbProfile.streak_count || 0,
        lastStreakDate: dbProfile.last_streak_date,
        examsTaken: dbProfile.exams_taken || 0,
        enrolledExams: dbProfile.enrolled_exams || 0,
        avatarUrl: dbProfile.avatar_url,
        avatarColor: dbProfile.avatar_color,
        createdAt: dbProfile.created_at,
        // Ensure strictly typed fields exist
        role: dbProfile.role || 'Student',
        status: dbProfile.status || 'Active',
        xp: dbProfile.xp || 0,
        level: dbProfile.level || 'Beginner',
        subscription: dbProfile.subscription || {
          plan: 'Free',
          status: 'Active',
          expiry: '',
        },
        recentExams: [], // Loaded separately via client-side calls if needed
      }
    : {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || 'Student',
        role: 'Student',
        status: 'Active',
        xp: 0,
        level: 'Beginner',
        examsTaken: 0,
        enrolledExams: 0,
        subscription: { plan: 'Free', status: 'Active', expiry: '' },
        recentExams: [],
      };

  return <DashboardClient user={userProfile} subjects={subjects} />;
}
