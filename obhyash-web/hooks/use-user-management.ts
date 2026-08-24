import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { FilterState } from '@/components/admin/user-management/AdvancedFilterBar';
import { User, UserRole } from '@/lib/types';
import { getErrorMessage } from '@/lib/error-utils';
import { useAuth } from '@/components/auth/AuthProvider';

/**
 * Custom hook for managing user data in the Admin Panel.
 * Uses server-side /api/admin/users for robust, fast, RLS-bypassing data operations.
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
  const [users, setUsers] = useState<User[]>(() => initialCache?.users || []);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(() => initialCache?.users || []);
  const [isLoading, setIsLoading] = useState(() => !initialCache);
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

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [advancedFilters, setAdvancedFilters] = useState<FilterState>({
    lastActiveRange: 'all',
    minExams: 0,
    maxExams: 10000,
    institutes: [],
    batches: [],
    subscriptionStatus: 'all',
  });

  // Bulk selection
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Prevent multiple concurrent fetches
  const isFetchingRef = useRef(false);

  /**
   * Fetches the latest list of users from the server API with pagination, search, and filters.
   */
  const fetchUsers = useCallback(async (showToast = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (showToast) setIsRefreshing(true);
    else if (!users.length) setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (advancedFilters.minExams > 0) params.set('minExams', String(advancedFilters.minExams));
      if (advancedFilters.maxExams < 10000) params.set('maxExams', String(advancedFilters.maxExams));
      if (advancedFilters.institutes.length > 0) params.set('institute', advancedFilters.institutes.join(','));
      if (advancedFilters.batches.length > 0) params.set('batch', advancedFilters.batches.join(','));
      if (advancedFilters.subscriptionStatus !== 'all') params.set('subscriptionStatus', advancedFilters.subscriptionStatus);

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to load users: HTTP ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch user list');
      }

      const fetchedUsers: User[] = json.users || [];
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
      setTotalUsers(json.totalUsers ?? fetchedUsers.length);

      if (json.stats) {
        setStats(json.stats);
      }

      // Cache page 1 baseline
      if (page === 1 && !searchQuery && roleFilter === 'all' && statusFilter === 'all') {
        try {
          sessionStorage.setItem(
            USERS_CACHE_KEY,
            JSON.stringify({ users: fetchedUsers, totalUsers: json.totalUsers || fetchedUsers.length }),
          );
        } catch {}
      }

      if (showToast) toast.success('Users refreshed successfully');
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [page, pageSize, searchQuery, roleFilter, statusFilter, advancedFilters, users.length]);

  // Trigger fetch when filters change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Single Actions
  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', userId, status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_role', userId, role: newRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

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
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(getErrorMessage(error));
    }
  };

  const handleUpdateSubscription = async (userId: string, plan: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_subscription', userId, plan }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

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

    const ids = Array.from(selectedUsers);

    try {
      if (action === 'delete') {
        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: ids }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } else if (action === 'activate' || action === 'deactivate') {
        const status = action === 'activate' ? 'Active' : 'Inactive';
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk_status', userIds: ids, status }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } else if (action === 'subscription') {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'bulk_subscription', userIds: ids, plan: value }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      }

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
    totalPages: Math.max(1, Math.ceil(totalUsers / pageSize)),
  };
}
