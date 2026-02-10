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

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    if (!user) {
      return redirect('/login');
    }
  }

  // Fetch Subjects for History & OMR
  const { data: subjectsData } = await supabase.from('subjects').select('*');
  const subjects = subjectsData || [];

  // Safe fallback if user exists in auth but not DB (shouldn't happen often)
  // But if it does, we can construct a basic profile from Auth data or wait for trigger
  const userProfile = profile || {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || 'Student',
    role: 'Student',
    status: 'Active',
    // ... defaults
    xp: 0,
    level: 'Beginner',
    examsTaken: 0,
    enrolledExams: 0,
    subscription: { plan: 'Free', status: 'Active', expiry: '' },
    recentExams: [],
  };

  return <DashboardClient user={userProfile} subjects={subjects} />;
}
