import { UserProfile } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';

/**
 * STRICT DATABASE CONTRACT
 * This interface defines EXACTLY what the 'users' table in Supabase expects.
 * It acts as a firewall against frontend state pollution.
 */
interface UserDatabaseRow {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;

  // Profile (Nullable in DB)
  dob?: string | null;
  gender?: string | null;
  address?: string | null;
  avatar_url?: string | null;
  avatar_color?: string | null;

  // Academic
  institute?: string | null;
  division?: string | null; // Frontend 'group' -> DB 'division'
  stream?: string | null;
  batch?: string | null;
  target?: string | null;

  // SSC Info
  ssc_roll?: string | null;
  ssc_reg?: string | null;
  ssc_board?: string | null;
  ssc_passing_year?: string | null;
  optional_subject?: string | null;

  // System
  updated_at: string;
}

/**
 * MAPPER: Frontend -> Backend
 * Pure function to convert UserProfile to UserDatabaseRow.
 * Handles undefined checks, renames, and sanitization.
 */
const mapProfileToDbRow = (user: UserProfile): UserDatabaseRow => {
  return {
    id: user.id,
    name: user.name,
    email: user.email || null,
    phone: user.phone || null,
    // explicitly handle undefined vs null if needed, here we treat undefined as null for DB
    dob: user.dob || null,
    gender: user.gender || null,
    address: user.address || null,

    avatar_url:
      user.avatarUrl || (user as UserProfile & { avatar_url?: string }).avatar_url || null,
    avatar_color: user.avatarColor || null,

    institute: user.institute || null,
    division: user.division || user.group || null, // Frontend 'group' -> DB 'division'
    stream: user.stream || null,
    batch: user.batch || null,
    target: user.target || null,

    ssc_roll: user.ssc_roll || null,
    ssc_reg: user.ssc_reg || null,
    ssc_board: user.ssc_board || null,
    ssc_passing_year: user.ssc_passing_year || null,
    optional_subject: user.optional_subject || null,

    updated_at: new Date().toISOString(),
  };
};

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
          examsTaken: data.exams_taken || 0,
          ssc_roll: data.ssc_roll,
          // Ensure we populate email/phone from Auth if missing in DB Profile
          email: data.email || authEmail,
          phone: data.phone || authPhone,
          // Map created_at for "Joined" date
          createdAt: data.created_at || authCreatedAt,

          name: data.name || 'User',
          level: data.level || 'Beginner',
          // No bio in DB
          streakCount: data.streak || data.streak_count || 0, // Handle potential DB column variations for read
          lastStreakDate: data.last_streak_date || null,
        } as UserProfile;
      }
      if (error) console.error('Error fetching user profile:', error);
    }
  }

  // Fallback: Local Storage or Mock
  if (typeof window !== 'undefined') {
    const localUser = localStorage.getItem('obhyash_user_profile');
    if (localUser) {
      try {
        return JSON.parse(localUser);
      } catch (e) {
        console.error('Failed to parse local user profile:', e);
        localStorage.removeItem('obhyash_user_profile');
        return null;
      }
    }
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

    // USE THE MAPPER - "The Firewall"
    // This ensures no extra fields (like bio, streak_count) ever reach the DB call
    const dbPayload = mapProfileToDbRow(user);

    console.log('📦 Data being sent to DB (Sanitized):', dbPayload);

    // Using upsert ensures the row is created if the Auth trigger missed it
    const { data, error } = await supabase
      .from('users')
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
