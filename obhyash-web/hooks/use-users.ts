import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User, UserRole, UserStatus } from '@/lib/types';
import { toast } from 'sonner';

// Define SubPlan type locally
type SubPlan = 'Free' | 'Pro' | 'Enterprise';

// 1. Internal Interface matching your Database Structure exactly
interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  phone: string | null;
  avatar_url: string | null;

  // New Personal & Academic Fields
  dob: string | null;
  gender: string | null;
  address: string | null;
  institute: string | null;
  goal: string | null;
  division: string | null;
  batch: string | null;
  ssc_roll: string | null;
  ssc_reg: string | null;
  ssc_board: string | null;
  ssc_passing_year: string | null;
  optional_subject: string | null;

  // Complex Objects
  subscription: { plan: string; expiry?: string; status: string } | null;
  enrolled_exams: number | null;
  updated_at: string | null;
  created_at: string | null;
}

export const useUsers = () => {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Helper to validate Subscription Status safely ---
  const validateSubStatus = (
    status?: string,
  ): 'Active' | 'Past Due' | 'Canceled' => {
    if (status === 'Active' || status === 'Past Due' || status === 'Canceled') {
      return status;
    }
    return 'Active'; // Default fallback
  };

  // --- 1. Fetch Users ---
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB data to UI Model
      const mappedUsers: User[] = (data || []).map((profile: Profile) => ({
        id: profile.id,
        name: profile.full_name || 'Unknown',
        email: profile.email || '',
        role: (profile.role || 'Student') as UserRole,
        status: (profile.status || 'Active') as UserStatus,
        phone: profile.phone || '',
        avatarUrl: profile.avatar_url || '',

        // --- Personal Info ---
        dob: profile.dob || '',
        gender: profile.gender || '',
        address: profile.address || '',

        // --- Academic Info ---
        institute: profile.institute || '',
        goal: profile.goal || '',
        division: profile.division || '',
        batch: profile.batch || '',
        ssc_roll: profile.ssc_roll || '',
        ssc_reg: profile.ssc_reg || '',
        ssc_board: profile.ssc_board || '',
        ssc_passing_year: profile.ssc_passing_year || '',
        optional_subject: profile.optional_subject || '',

        // --- Subscription (Fixed Type Error) ---
        subscription: profile.subscription
          ? {
              plan: (profile.subscription.plan as SubPlan) || 'Free',
              expiry: profile.subscription.expiry ?? 'N/A',
              status: validateSubStatus(profile.subscription.status),
            }
          : {
              plan: 'Free' as SubPlan,
              expiry: 'N/A',
              status: 'Active',
            },

        enrolledExams: profile.enrolled_exams || 0,
        lastActive: new Date(
          profile.updated_at || Date.now(),
        ).toLocaleDateString(),
        recentExams: [],
      }));

      setUsers(mappedUsers);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // --- 2. Create or Update User ---
  const saveUser = async (user: Partial<User>) => {
    try {
      // Prepare Payload for DB
      const payload = {
        full_name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,

        // Map all new fields
        dob: user.dob,
        gender: user.gender,
        address: user.address,
        institute: user.institute,
        goal: user.goal,
        division: user.division,
        batch: user.batch,
        ssc_roll: user.ssc_roll,
        ssc_reg: user.ssc_reg,
        ssc_board: user.ssc_board,
        ssc_passing_year: user.ssc_passing_year,
        optional_subject: user.optional_subject,

        updated_at: new Date().toISOString(),
      };

      if (user.id) {
        // --- UPDATE ---
        const { error } = await supabase
          .from('profiles')
          .update(payload)
          .eq('id', user.id);

        if (error) throw error;
        toast.success('User updated successfully');
      } else {
        // --- CREATE ---
        const { error } = await supabase.from('profiles').insert({
          ...payload,
          created_at: new Date().toISOString(),
          subscription: { plan: 'Free', status: 'Active', expiry: 'N/A' },
          enrolled_exams: 0,
        });

        if (error) throw error;
        toast.success('User profile created');
      }

      await fetchUsers(); // Refresh list
      return true;
    } catch (err) {
      console.error(err);
      toast.error('Operation failed');
      return false;
    }
  };

  // --- 3. Delete User ---
  const deleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;

      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  return {
    users,
    isLoading,
    fetchUsers,
    saveUser,
    deleteUser,
  };
};
