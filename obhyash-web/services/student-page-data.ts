import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { UserProfile } from '@/lib/types';

export async function getStudentPageData(): Promise<{
  userProfile: UserProfile;
  subjects: any[];
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [{ data: dbProfile }, { data: subjectsData }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('subjects').select('*'),
  ]);
  const subjects = subjectsData || [];

  const userProfile: UserProfile = dbProfile
    ? {
        ...dbProfile,
        streakCount: dbProfile.streak || dbProfile.streak_count || 0,
        lastStreakDate: dbProfile.last_streak_date,
        examsTaken: dbProfile.exams_taken || 0,
        enrolledExams: dbProfile.enrolled_exams || 0,
        avatarUrl: dbProfile.avatar_url,
        avatarColor: dbProfile.avatar_color,
        createdAt: dbProfile.created_at,
        role: dbProfile.role || 'Student',
        status: dbProfile.status || 'Active',
        xp: dbProfile.xp || 0,
        level: dbProfile.level || 'Beginner',
        subscription: dbProfile.subscription || {
          plan: 'Free',
          status: 'Active',
          expiry: '',
        },
        recentExams: [],
      }
    : {
        id: user.id,
        email: user.email || '',
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

  return { userProfile, subjects };
}
