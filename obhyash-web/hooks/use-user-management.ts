import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { FilterState } from '@/components/admin/user-management/AdvancedFilterBar';
import { User, UserRole } from '@/lib/types';

/**
 * Custom hook for managing user data in the Admin Panel.
 * Handles fetching, filtering, searching, and bulk actions for users.
 *
 * @returns An object containing user data, loading states, filter controls, and action handlers.
 */
export function useUserManagement() {
  // --- State Management ---

  /** Full list of users fetched from the database */
  const [users, setUsers] = useState<User[]>([]);

  /** Filtered list of users based on search and filter criteria */
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  /** Loading state for initial fetch */
  const [isLoading, setIsLoading] = useState(true);

  /** Loading state for manual refresh */
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, statusFilter, users, advancedFilters]);

  /**
   * Fetches the latest list of users from Supabase.
   * Maps the raw database response to the global User type.
   *
   * @param showToast - Whether to show a success toast on completion.
   */
  const fetchUsers = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map DB fields to User type
      interface UserRow {
        id: string;
        name?: string;
        email?: string;
        phone?: string;
        role?: string;
        status?: string;
        avatar_url?: string;
        institute?: string;
        division?: string;
        batch?: string;
        exams_taken?: number;
        created_at: string;
        subscription?: { plan: string; status: string; expiry: string };
        goal?: string;
        target?: string;
        stream?: string;
        ssc_roll?: string;
        ssc_reg?: string;
        ssc_board?: string;
        ssc_passing_year?: string;
        level?: string;
        xp?: number;
        avatar_color?: string;
      }

      const mappedUsers: User[] = (data || []).map((u: UserRow) => ({
        id: u.id,
        name: u.name || '',
        email: u.email || '',
        phone: u.phone,
        role: (u.role || 'Student') as UserRole,
        status: (u.status || 'Active') as User['status'],
        avatarUrl: u.avatar_url,
        institute: u.institute,
        division: u.division,
        batch: u.batch,
        enrolledExams: u.exams_taken || 0, // Map exams_taken to enrolledExams
        lastActive: u.created_at, // Using created_at as proxy for now if last_active missing
        subscription: u.subscription
          ? {
              plan: u.subscription.plan as 'Free' | 'Pro' | 'Enterprise',
              status: u.subscription.status as 'Active' | 'Past Due' | 'Canceled',
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
        ssc_roll: u.ssc_roll,
        ssc_reg: u.ssc_reg,
        ssc_board: u.ssc_board,
        ssc_passing_year: u.ssc_passing_year,
        level: u.level,
        xp: u.xp,
        avatarColor: u.avatar_color,
      }));

      setUsers(mappedUsers);
      if (showToast) toast.success('Users refreshed successfully');
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.phone?.includes(searchQuery),
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    // Advanced Filters Logic
    if (advancedFilters.lastActiveRange !== 'all') {
      const now = new Date();
      filtered = filtered.filter((user) => {
        const userDate = new Date(user.lastActive);
        const diffDays =
          (now.getTime() - userDate.getTime()) / (1000 * 3600 * 24);

        if (advancedFilters.lastActiveRange === '7days') return diffDays <= 7;
        if (advancedFilters.lastActiveRange === '30days') return diffDays <= 30;
        if (advancedFilters.lastActiveRange === 'inactive')
          return diffDays > 30;
        return true;
      });
    }

    if (advancedFilters.minExams > 0 || advancedFilters.maxExams < 10000) {
      filtered = filtered.filter(
        (u) =>
          u.enrolledExams >= advancedFilters.minExams &&
          u.enrolledExams <= advancedFilters.maxExams,
      );
    }

    if (advancedFilters.subscriptionStatus !== 'all') {
      filtered = filtered.filter((u) =>
        advancedFilters.subscriptionStatus === 'Expired'
          ? u.subscription?.status !== 'Active'
          : u.subscription?.status === advancedFilters.subscriptionStatus,
      );
    }

    if (advancedFilters.institutes.length > 0) {
      filtered = filtered.filter(
        (u) => u.institute && advancedFilters.institutes.includes(u.institute),
      );
    }

    if (advancedFilters.batches.length > 0) {
      filtered = filtered.filter(
        (u) => u.batch && advancedFilters.batches.includes(u.batch),
      );
    }

    setFilteredUsers(filtered);
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
      toast.error('Failed to update user status');
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
      toast.error('Failed to update user role');
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
      toast.error('Failed to delete user');
    }
  };

  const handleUpdateSubscription = async (userId: string, plan: string) => {
    const supabase = createClient();
    try {
      const { error } = await supabase
        .from('users')
        .update({
          subscription: { plan, status: 'Active' },
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
      toast.error('Failed to update subscription');
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
      let payload: Record<string, string | { plan: string | undefined; status: string }> = {};

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
      toast.error('Failed to execute bulk action');
    }
  };

  return {
    users,
    filteredUsers,
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
  };
}
