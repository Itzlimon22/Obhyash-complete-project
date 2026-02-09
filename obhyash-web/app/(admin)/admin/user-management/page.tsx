'use client';

import React, { useState } from 'react';
import {
  RefreshCw,
  Download,
  Mail,
  Trash2,
  CheckCircle,
  Clock,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/lib/types';

// Hook
import { useUserManagement } from '@/hooks/use-user-management';

// Components
import ActivityLogModal from '@/components/admin/user-management/ActivityLogModal';
import BulkEmailModal from '@/components/admin/user-management/BulkEmailModal';
import AdvancedFilterBar from '@/components/admin/user-management/AdvancedFilterBar';
import DetailsModal from '@/components/admin/user-management/DetailsModal';
import ManageSubscriptionModal from '@/components/admin/user-management/ManageSubscriptionModal';
import UserStatsCards from '@/components/admin/user-management/UserStatsCards';
import UserFilters from '@/components/admin/user-management/UserFilters';
import UserTable from '@/components/admin/user-management/UserTable';
import EditUserModal from '@/components/admin/user-management/EditUserModal';

export default function UserManagementPage() {
  const {
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
  } = useUserManagement();

  // Local Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUser, setEditUser] = useState<User | undefined>(undefined);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsUser, setDetailsUser] = useState<User | null>(null);

  const [showActivityLogModal, setShowActivityLogModal] = useState(false);
  const [activityLogUserId, setActivityLogUserId] = useState<string | null>(
    null,
  );
  const [activityLogUserName, setActivityLogUserName] = useState<string | null>(
    null,
  );

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionUser, setSubscriptionUser] = useState<User | null>(null);

  const [showBulkEmailModal, setShowBulkEmailModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Handlers for Modals
  const onEditUser = (user: User) => {
    setEditUser(user);
    setShowEditModal(true);
  };

  const onViewDetails = (user: User) => {
    setDetailsUser(user);
    setShowDetailsModal(true);
  };

  const onViewActivityLog = (user: User) => {
    setActivityLogUserId(user.id);
    setActivityLogUserName(user.name);
    setShowActivityLogModal(true);
  };

  const onManageSubscription = (user: User) => {
    setSubscriptionUser(user);
    setShowSubscriptionModal(true);
  };

  const handleExport = () => {
    toast.success('Preparing user data export...');
    setTimeout(() => {
      const csv = [
        [
          'Name',
          'Email',
          'Phone',
          'Role',
          'Status',
          'Institute',
          'Exams Taken',
          'Created At',
        ].join(','),
        ...filteredUsers.map((user) =>
          [
            user.name || '',
            user.email || '',
            user.phone || '',
            user.role,
            user.status,
            user.institute || '',
            user.enrolledExams,
            new Date(user.lastActive).toLocaleDateString(),
          ].join(','),
        ),
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      toast.success('User data exported successfully!');
    }, 1000);
  };

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === 'Active').length,
    students: users.filter((u) => u.role === 'Student').length,
    premium: users.filter((u) => u.subscription?.plan !== 'Free').length,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
              User Management
            </h1>
            <p className="text-xs lg:text-base text-neutral-600 dark:text-neutral-400 mt-1">
              Manage student accounts, roles, and permissions
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={() => fetchUsers(true)}
              disabled={isRefreshing}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs md:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleExport}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs md:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-[0.98]"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <UserStatsCards stats={stats} isLoading={isLoading} />

        {/* Filters */}
        <div className="space-y-4">
          <UserFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            showAdvancedFilters={showAdvancedFilters}
            setShowAdvancedFilters={setShowAdvancedFilters}
          />

          <AdvancedFilterBar
            isOpen={showAdvancedFilters}
            users={users}
            onFilterChange={setAdvancedFilters}
            onToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
          />
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedUsers.size > 0 && (
          <div className="p-3 md:p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center justify-between md:justify-start gap-3">
                <p className="text-xs md:text-sm font-bold text-rose-900 dark:text-rose-100">
                  {selectedUsers.size} user(s) selected
                </p>
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline"
                >
                  Clear
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => activeBulkAction('activate')}
                  className="flex-1 md:flex-none px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] md:text-sm font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Activate
                </button>
                <button
                  onClick={() => activeBulkAction('deactivate')}
                  className="flex-1 md:flex-none px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-[11px] md:text-sm font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Deactivate
                </button>

                <div className="relative group">
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="flex-1 md:flex-none px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[11px] md:text-sm font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Sub
                  </button>
                  {showBulkActions && (
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50">
                      <div className="py-2">
                        <button
                          onClick={() => {
                            activeBulkAction('subscription', 'Free');
                            setShowBulkActions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        >
                          Free Plan
                        </button>
                        <button
                          onClick={() => {
                            activeBulkAction('subscription', 'Premium');
                            setShowBulkActions(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                        >
                          Premium Plan
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => activeBulkAction('delete')}
                  className="flex-1 md:flex-none px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-[11px] md:text-sm font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
                <button
                  onClick={() => setShowBulkEmailModal(true)}
                  className="flex-1 md:flex-none px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] md:text-sm font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <p className="text-[10px] md:text-sm text-neutral-600 dark:text-neutral-400">
            Showing{' '}
            <span className="font-bold text-neutral-900 dark:text-white">
              {filteredUsers.length}
            </span>{' '}
            of{' '}
            <span className="font-bold text-neutral-900 dark:text-white">
              {users.length}
            </span>{' '}
            users
          </p>
        </div>

        {/* Table */}
        <UserTable
          users={filteredUsers}
          isLoading={isLoading}
          selectedUsers={selectedUsers}
          onSelectAll={handleSelectAll}
          onSelectUser={handleSelectUser}
          onViewDetails={onViewDetails}
          onViewActivityLog={onViewActivityLog}
          onEditUser={onEditUser}
          onManageSubscription={onManageSubscription}
          onUpdateSubscription={handleUpdateSubscription}
          onResetPassword={(id, email) =>
            console.log('Reset Password', id, email)
          } // Placeholder or pass logic
          onUpdateStatus={handleUpdateStatus}
          onDeleteUser={handleDeleteUser}
        />

        {/* Modals */}
        {showEditModal && editUser && (
          <EditUserModal
            user={editUser}
            onClose={() => setShowEditModal(false)}
            onSuccess={() => fetchUsers()}
          />
        )}

        {/* Reusing existing Modals */}
        {showDetailsModal && detailsUser && (
          <DetailsModal
            user={detailsUser}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
          />
        )}

        {showActivityLogModal && activityLogUserId && (
          <ActivityLogModal
            userId={activityLogUserId}
            userName={activityLogUserName || 'User'}
            isOpen={showActivityLogModal}
            onClose={() => setShowActivityLogModal(false)}
          />
        )}

        {showBulkEmailModal && (
          <BulkEmailModal
            isOpen={showBulkEmailModal}
            userIds={Array.from(selectedUsers)}
            selectedCount={selectedUsers.size}
            onClose={() => setShowBulkEmailModal(false)}
            onSuccess={() => setShowBulkEmailModal(false)}
          />
        )}

        {showSubscriptionModal && subscriptionUser && (
          <ManageSubscriptionModal
            user={subscriptionUser}
            isOpen={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
            onUpdate={() => fetchUsers()}
          />
        )}
      </div>
    </div>
  );
}
