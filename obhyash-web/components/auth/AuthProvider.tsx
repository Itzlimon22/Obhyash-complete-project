'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const hasAttemptedProfileCreation = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as UserProfile;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  };

  const handleProfileCreation = async (currentUser: User) => {
    // Only attempt once per session/mount to avoid loops
    if (hasAttemptedProfileCreation.current) return;

    const tempProfileData = localStorage.getItem('temp_signup_data');
    if (!tempProfileData) return;

    hasAttemptedProfileCreation.current = true;

    try {
      const profileData = JSON.parse(tempProfileData);

      toast.info('আপনার প্রোফাইল সম্পূর্ণ করা হচ্ছে...', { duration: 2000 });

      // Call API to create profile securely
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create profile');
      }

      toast.success('প্রোফাইল সফলভাবে তৈরি হয়েছে!');

      // Clear temp data
      localStorage.removeItem('temp_signup_data');

      // Fetch the newly created profile
      const newProfile = await fetchProfile(currentUser.id);
      if (newProfile) {
        setProfile(newProfile);
      }

      // Refresh the page or redirect to ensure app state is consistent
      router.refresh();
    } catch (error) {
      console.error('Error creating profile from temp data:', error);
      toast.error('প্রোফাইল তৈরিতে সমস্যা হয়েছে।');
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 1. Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);

          // 2. Fetch Profile
          let userProfile = await fetchProfile(session.user.id);

          if (userProfile) {
            setProfile(userProfile);
          } else {
            // 3. If no profile, check for temp data and create it
            await handleProfileCreation(session.user);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // 4. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log('Auth state changed:', event);

      if (session?.user) {
        setUser(session.user);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const userProfile = await fetchProfile(session.user.id);
          if (userProfile) {
            setProfile(userProfile);
          } else {
            await handleProfileCreation(session.user);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/login');
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      if (userProfile) setProfile(userProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
