import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { FilterState } from '@/components/admin/user-management/AdvancedFilterBar';
import { User, UserRole } from '@/lib/types';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * Custom hook for managing user data in the Admin Panel.
 * Handles fetching, filtering, searching, and bulk actions for users.
 *
 * @returns An object containing user data, loading states, filter controls, and action handlers.
 */
const USERS_CACHE_KEY = 'obhyash_admin_users_cache';

function getInitialCachedUsers(): { users: User[]; totalUsers: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(USERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
      return parsed;
    }
  } catch {}
  return null;
}

export function useUserManagement() {
  const { user } = useAuth();
  const initialCache = getInitialCachedUsers();

  // --- State Management ---

  /** Full list of users fetched from the database */
  const [users, setUsers] = useState<User[]>(() => initialCache?.users || []);

  /** Filtered list of users based on search and filter criteria */
  const [filteredUsers, setFilteredUsers] = useState<User[]>(() => initialCache?.users || []);

  /** Loading state for initial fetch */
  const [isLoading, setIsLoading] = useState(() => !initialCache);

  /** Loading state for manual refresh */
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalUsers, setTotalUsers] = useState(() => initialCache?.totalUsers || 0);

  // Global aggregate stats across ALL users in database
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    students: 0,
    premium: 0,
  });

  /** Search query string (name, email, phone) */
  const [searchQuery, setSearchQuery] = useState('');

  /** Filter by user role (e.g., 'Student', 'Teacher', 'Admin') */
  const [roleFilter, setRoleFilter] = useState<string>('all');

  /** Filter by user status (e.g., 'Active', 'Inactive') */
  const [statusFilter, setStatusFilter] = useState<string>('all');

  /** Complex advanced filters */
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    lastActiveRange: 'all',
    minExams: 0,
    maxExams: 10000,
    institutes: [],
    batches: [],
    subscriptionStatus: 'all',
  });

  // Bulk actions state
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Reset to page 1 when filters change (except when explicitly changing page)
    setPage(1);
    fetchUsers();
  }, [searchQuery, roleFilter, statusFilter, advancedFilters, pageSize, user?.id]);

  useEffect(() => {
    fetchUsers();
  }, [page, user?.id]);

  /**
   * Fetches the latest list of users from Supabase with server-side pagination and filtering.
   * Maps the raw database response to the global User type.
   *
   * @param showToast - Whether to show a success toast on completion.
   */
  const fetchUsers = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    const supabase = createClient();
    try {
      let query = supabase.from('users').select('*', { count: 'exact' });

      // Apply Server-Side Filters
      if (searchQuery) {
        const q = searchQuery.trim();
        // Search across Student ID (e.g. OBH-10492), name, email, phone
        query = query.or(
          `student_id.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`,
        );
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      // Advanced Filters (Partial translation to server-side)
      if (advancedFilters.minExams > 0) {
        query = query.gte('exams_taken', advancedFilters.minExams);
      }
      if (advancedFilters.maxExams < 10000) {
        query = query.lte('exams_taken', advancedFilters.maxExams);
      }
      if (advancedFilters.institutes.length > 0) {
        query = query.in('institute', advancedFilters.institutes);
      }
      if (advancedFilters.batches.length > 0) {
        query = query.in('batch', advancedFilters.batches);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      // Map DB fields to User type
      interface UserRow {
        id: string;
        student_id?: string;
        name?: string;
        email?: string;
        phone?: string;
        role?: string;
        status?: string;
        avatar_url?: string;
        institute?: string;
        division?: string;
        batch?: string;
        batch_change_count?: number;
        exams_taken?: number;
        created_at: string;
        subscription?: { plan: string; status: string; expiry: string };
        goal?: string;
        target?: string;
        stream?: string;
        exam_target?: string;
        daily_exams_goal?: number;
        ssc_roll?: string;
        ssc_reg?: string;
        ssc_board?: string;
        ssc_passing_year?: string;
        optional_subject?: string;
        gender?: string;
        dob?: string;
        address?: string;
        bio?: string;
        streak?: number;
        level?: string;
        xp?: number;
        avatar_color?: string;
      }

      const mappedUsers: User[] = (data || []).map((u: UserRow) => ({
        id: u.id,
        student_id: u.student_id,
        name: u.name || '',
        email: u.email || '',
        phone: u.phone,
        role: (u.role || 'Student') as UserRole,
        status: (u.status || 'Active') as User['status'],
        avatarUrl: u.avatar_url,
        institute: u.institute,
        division: u.division,
        batch: u.batch,
        batch_change_count: u.batch_change_count ?? 0,
        enrolledExams: u.exams_taken || 0, // Map exams_taken to enrolledExams
        lastActive: u.created_at, // Using created_at as proxy for now if last_active missing
        subscription: u.subscription
          ? {
              plan: u.subscription.plan as 'Free' | 'Pro' | 'Enterprise',
              status: u.subscription.status as
                | 'Active'
                | 'Past Due'
                | 'Canceled',
              expiry: u.subscription.expiry,
            }
          : {
              plan: 'Free' as const,
              status: 'Active' as const,
              expiry: '',
            },
        recentExams: [], // Placeholder
        goal: u.goal,
        target: u.target,
        stream: u.stream,
        exam_target: u.exam_target,
        daily_exams_goal: u.daily_exams_goal ?? 3,
        ssc_roll: u.ssc_roll,
        ssc_reg: u.ssc_reg,
        ssc_board: u.ssc_board,
        ssc_passing_year: u.ssc_passing_year,
        optional_subject: u.optional_subject,
        gender: u.gender,
        dob: u.dob,
        address: u.address,
        bio: u.bio,
        streakCount: u.streak || 0,
        level: u.level,
        xp: u.xp,
        avatarColor: u.avatar_color,
      }));

      setUsers(mappedUsers);

      // Client-side filtering pass for complex JSON criteria like subscriptions and dates
      // which are harder to query directly if 'subscription' is JSONB
      let clientFiltered = [...mappedUsers];

      if (advancedFilters.lastActiveRange !== 'all') {
        const now = new Date();
        clientFiltered = clientFiltered.filter((user) => {
          const userDate = new Date(user.lastActive);
          const diffDays =
            (now.getTime() - userDate.getTime()) / (1000 * 3600 * 24);

          if (advancedFilters.lastActiveRange === '7days') return diffDays <= 7;
          if (advancedFilters.lastActiveRange === '30days')
            return diffDays <= 30;
          if (advancedFilters.lastActiveRange === 'inactive')
            return diffDays > 30;
          return true;
        });
      }

      if (advancedFilters.subscriptionStatus !== 'all') {
        clientFiltered = clientFiltered.filter((u) =>
          advancedFilters.subscriptionStatus === 'Expired'
            ? u.subscription?.status !== 'Active'
            : u.subscription?.status === advancedFilters.subscriptionStatus,
        );
      }

      setFilteredUsers(clientFiltered);
      if (count !== null) setTotalUsers(count);

      // Fetch global real-time stats across ALL users in database
      try {
        const [totalCountRes, activeCountRes, studentsCountRes, allSubsRes] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'Student'),
          supabase.from('users').select('subscription'),
        ]);

        const totalCount = totalCountRes.count ?? count ?? mappedUsers.length;
        const activeCount = activeCountRes.count ?? mappedUsers.filter((u) => u.status === 'Active').length;
        const studentsCount = studentsCountRes.count ?? mappedUsers.filter((u) => u.role === 'Student').length;

        let premiumCount = 0;
        if (allSubsRes.data && allSubsRes.data.length > 0) {
          const now = new Date();
          premiumCount = allSubsRes.data.filter((u: any) => {
            if (!u.subscription || typeof u.subscription !== 'object') return false;
            const plan = u.subscription.plan;
            if (!plan || plan === 'Free' || plan === 'free') return false;
            if (u.subscription.expiry) {
              const exp = new Date(u.subscription.expiry);
              if (!isNaN(exp.getTime()) && exp < now) return false;
            }
            if (u.subscription.status === 'Canceled' || u.subscription.status === 'Past Due') return false;
            return true;
          }).length;
        }

        setStats({
          total: totalCount,
          active: activeCount,
          students: studentsCount,
          premium: premiumCount,
        });
      } catch (statsErr) {
        console.error('Failed to fetch aggregate user stats:', statsErr);
      }

      if (page === 1 && searchQuery === '' && roleFilter === 'all' && statusFilter === 'all') {
        try {
          sessionStorage.setItem(
            USERS_CACHE_KEY,
            JSON.stringify({ users: mappedUsers, totalUsers: count || mappedUsers.length }),
          );
        } catch {}
      }

      if (showToast) toast.success('Users refreshed successfully');
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Helper: Log Activity
  const logActivity = async (
    userId: string,
    type: string,
    description: string,
  ) => {
    const supabase = createClient();
    try {
      await supabase.from('user_activity_log').insert({
        user_id: userId,
        activity_type: type,
        description: description,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
      // Don't block UI on logging failure
    }
  };

  // Actions
  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', userId);
      if (error) throw error;

      await logActivity(userId, 'UPDATE', `Status updated to ${newStatus}`);

      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;

      await logActivity(userId, 'UPDATE', `Role updated to ${newRole}`);

      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this user? This action cannot be undone.',
      )
    )
      return;
    const supabase = createClient();
    try {
      // Log before delete (best effort, as user will be gone)
      await logActivity(userId, 'DELETE', `User account deleted`);

      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateSubscription = async (userId: string, plan: string) => {
    const supabase = createClient();
    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      const expiryIso = expiry.toISOString();

      const { error } = await supabase
        .from('users')
        .update({
          subscription: { plan, status: 'Active', expiry: expiryIso },
          is_subscribed: true,
          subscription_status: 'active',
          subscription_expires_at: expiryIso,
          plan: plan,
        })
        .eq('id', userId);

      if (error) throw error;

      await logActivity(
        userId,
        'SUBSCRIPTION',
        `Subscription updated to ${plan} plan`,
      );

      toast.success(`Subscription updated to ${plan} plan`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update subscription:', error);
      toast.error(getErrorMessage(error));
    }
  };

  // Bulk Actions
  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const activeBulkAction = async (
    action: 'activate' | 'deactivate' | 'delete' | 'subscription',
    value?: string,
  ) => {
    if (selectedUsers.size === 0) return;

    // Confirmation
    const actionText =
      action === 'delete'
        ? 'DELETE'
        : action === 'subscription'
          ? `update to ${value} plan`
          : action;
    if (
      !confirm(
        `${action === 'delete' ? '⚠️ ' : ''}${actionText.toUpperCase()} ${selectedUsers.size} selected user(s)?`,
      )
    )
      return;

    const supabase = createClient();
    const ids = Array.from(selectedUsers);

    try {
      const query = supabase.from('users');
      let payload: Record<
        string,
        string | { plan: string | undefined; status: string }
      > = {};

      if (action === 'activate') payload = { status: 'Active' };
      if (action === 'deactivate') payload = { status: 'Inactive' };
      if (action === 'subscription')
        payload = { subscription: { plan: value, status: 'Active' } };

      let error;
      if (action === 'delete') {
        ({ error } = await query.delete().in('id', ids));
      } else {
        ({ error } = await query.update(payload).in('id', ids));
      }

      if (error) throw error;

      // Log actions for all affected users
      // Note: In production this should be a batch insert or background job
      ids.forEach((id) => {
        logActivity(
          id,
          'BULK_UPDATE',
          `Bulk action: ${action} ${value ? `(${value})` : ''}`,
        );
      });

      toast.success('Bulk action completed successfully');
      setSelectedUsers(new Set());
      fetchUsers();
    } catch (error) {
      console.error('Bulk action failed:', error);
      toast.error(getErrorMessage(error));
    }
  };

  return {
    users,
    filteredUsers,
    stats,
    isLoading,
    isRefreshing,
    fetchUsers,

    // Filters
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    advancedFilters,
    setAdvancedFilters,

    // Selection
    selectedUsers,
    setSelectedUsers,
    handleSelectAll,
    handleSelectUser,

    // Single Actions
    handleUpdateStatus,
    handleUpdateRole,
    handleDeleteUser,
    handleUpdateSubscription,

    // Bulk Actions
    activeBulkAction,

    // Pagination
    page,
    setPage,
    pageSize,
    setPageSize,
    totalUsers,
    totalPages: Math.ceil(totalUsers / pageSize),
  };
}
