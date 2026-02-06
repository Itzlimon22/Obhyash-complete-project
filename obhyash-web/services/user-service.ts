import { UserProfile } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';

export const getUserProfile = async (
  userId: string,
): Promise<UserProfile | null> => {
  if (isSupabaseConfigured() && supabase) {
    let targetUserId = userId;
    let authEmail = '';
    let authPhone = '';
    let authCreatedAt = '';

    // Resolve 'me' to the actual authenticated user ID
    if (userId === 'me') {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        targetUserId = user.id;
        authEmail = user.email || '';
        authPhone = user.phone || '';
        authCreatedAt = user.created_at || '';
      }
    }

    // Only query DB if we have a valid UUID (simple check)
    if (targetUserId && targetUserId !== 'me') {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();
      if (!error && data) {
        return {
          ...data,
          // Map DB snake_case to Frontend camelCase
          avatarUrl: data.avatar_url,
          avatarColor: data.avatar_color,
          examsTaken: data.exams_taken,
          ssc_roll: data.ssc_roll,
          // Ensure we populate email/phone from Auth if missing in DB Profile
          email: data.email || authEmail,
          phone: data.phone || authPhone,
          // Map created_at for "Joined" date
          createdAt: data.created_at || authCreatedAt,
          // DB has 'division', Frontend uses 'division' (but mapped to Group in forms)
          // Ensure defaults
          name: data.name || 'User',
          level: data.level || 'Beginner',
          bio: data.bio || '',
        };
      }
      if (error) console.error('Error fetching user profile:', error);
    }
  }

  // Fallback: Local Storage or Mock
  if (typeof window !== 'undefined') {
    const localUser = localStorage.getItem('obhyash_user_profile');
    if (localUser) return JSON.parse(localUser);
  }

  return null;
};

export const updateUserProfile = async (
  user: UserProfile,
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if supabase is initialized
    if (!supabase) {
      return { success: false, error: 'Supabase client not found' };
    }

    console.log('🔄 Attempting to update profile for user:', user.id);

    // Map Frontend camelCase to DB snake_case to match your new SQL schema
    const dbPayload = {
      id: user.id, // Primary key for upsert
      name: user.name,
      dob: user.dob || null,
      gender: user.gender || null,
      address: user.address || null,
      bio: user.bio || null,
      avatar_url: user.avatarUrl || null,
      avatar_color: user.avatarColor || null,
      institute: user.institute,
      division: user.division,
      stream: user.stream,
      batch: user.batch,
      target: user.target,
      ssc_roll: user.ssc_roll,
      ssc_reg: user.ssc_reg,
      ssc_board: user.ssc_board,
      ssc_passing_year: user.ssc_passing_year,
      optional_subject: user.optional_subject,
      updated_at: new Date().toISOString(),
    };

    console.log('📦 Data being sent to DB:', dbPayload);

    // Using upsert ensures the row is created if the Auth trigger missed it
    const { data, error } = await supabase
      .from('users') // Matches your new SQL 'users' table
      .upsert(dbPayload)
      .select();

    if (error) {
      console.error('❌ Database update error:', error);
      return {
        success: false,
        error: error.message || 'Database permission error',
      };
    }

    console.log('✅ Profile updated in database:', data);

    // Only update Local Storage after the database confirms success
    if (typeof window !== 'undefined') {
      localStorage.setItem('obhyash_user_profile', JSON.stringify(user));
    }

    return { success: true };
  } catch (error: unknown) {
    console.error('Unexpected error updating profile:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Unknown error occurred during update',
    };
  }
};
