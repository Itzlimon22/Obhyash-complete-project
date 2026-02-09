import React, { useState } from 'react';
import {
  Users as UsersIcon,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  Calendar,
  MoreVertical,
  Eye,
  Activity,
  Edit,
  Settings,
  XCircle,
  CheckCircle,
  Ban,
  Trash2,
  Crown,
  Clock,
} from 'lucide-react';
import { User } from '@/lib/types'; // Assuming User type is in types.ts
import { useUserManagement } from '@/hooks/use-user-management';
import { toast } from 'sonner';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  selectedUsers: Set<string>;
  onSelectAll: () => void;
  onSelectUser: (userId: string) => void;
  // Action Handlers
  onViewDetails: (user: User) => void;
  onViewActivityLog: (user: User) => void;
  onEditUser: (user: User) => void;
  onManageSubscription: (user: User) => void;
  onUpdateSubscription: (userId: string, plan: string) => void;
  onResetPassword: (userId: string, email: string) => void;
  onUpdateStatus: (userId: string, status: string) => void;
  onDeleteUser: (userId: string) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  selectedUsers,
  onSelectAll,
  onSelectUser,
  onViewDetails,
  onViewActivityLog,
  onEditUser,
  onManageSubscription,
  onUpdateSubscription,
  onResetPassword,
  onUpdateStatus,
  onDeleteUser,
}) => {
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10';
      case 'Inactive':
        return 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800';
      case 'Suspended':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10';
      default:
        return 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10';
      case 'Teacher':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10';
      case 'Student':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10';
      default:
        return 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden py-24 flex flex-col items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">
          Loading users...
        </p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden py-24 flex flex-col items-center justify-center">
        <UsersIcon className="w-16 h-16 text-neutral-300 dark:text-neutral-700 mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-2">
          No users found
        </p>
        <p className="text-sm text-neutral-500 dark:text-neutral-500">
          Try adjusting your filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile User Cards */}
      <div className="lg:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm active:scale-[0.99] transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.id)}
                  onChange={() => onSelectUser(user.id)}
                  className="w-5 h-5 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {user.name || 'Unnamed User'}
                  </p>
                  <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                    {user.email || 'No email'}
                  </p>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionMenu(
                      showActionMenu === user.id ? null : user.id,
                    );
                  }}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </button>

                {showActionMenu === user.id && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50">
                    <div className="py-2">
                      <button
                        onClick={() => {
                          onViewDetails(user);
                          setShowActionMenu(null);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Details
                      </button>
                      <button
                        onClick={() => {
                          onViewActivityLog(user);
                          setShowActionMenu(null);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                      >
                        <Activity className="w-4 h-4" />
                        View Activity Log
                      </button>
                      <button
                        onClick={() => {
                          onEditUser(user);
                          setShowActionMenu(null);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit User
                      </button>
                      <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>
                      <button
                        onClick={() => {
                          onDeleteUser(user.id);
                          setShowActionMenu(null);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Role
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${getRoleColor(
                    user.role,
                  )}`}
                >
                  {user.role}
                </span>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Status
                </p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${getStatusColor(
                    user.status,
                  )}`}
                >
                  {user.status}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Institute
                </p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium truncate">
                  {user.institute || 'N/A'}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Exams
                </p>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 font-bold">
                  {user.enrolledExams || 0}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop User Table */}
      <div className="hidden lg:block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden text-center ">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedUsers.size === users.length && users.length > 0
                    }
                    onChange={onSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  Institute
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  Exams
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => onSelectUser(user.id)}
                      className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                          {user.name || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                          {user.subscription?.plan === 'Pro' && (
                            <Crown className="w-3 h-3 text-amber-500" />
                          )}
                          {user.subscription?.plan || 'Free'} Plan
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-left">
                      {user.email && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <Mail className="w-3.5 h-3.5" />
                          {user.email}
                        </div>
                      )}
                      {user.phone && (
                        <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                          <Phone className="w-3.5 h-3.5" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getRoleColor(
                        user.role,
                      )}`}
                    >
                      {user.role === 'Admin' && (
                        <Shield className="w-3.5 h-3.5" />
                      )}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusColor(
                        user.status,
                      )}`}
                    >
                      {user.status === 'Active' && (
                        <CheckCircle className="w-3.5 h-3.5" />
                      )}
                      {user.status === 'Suspended' && (
                        <Ban className="w-3.5 h-3.5" />
                      )}
                      {user.status === 'Inactive' && (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <p className="text-sm text-neutral-900 dark:text-white truncate max-w-[150px]">
                      {user.institute || 'N/A'}
                    </p>
                    {user.batch && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {user.batch}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                      {user.enrolledExams || 0}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-left">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(user.lastActive).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="relative inline-block">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActionMenu(
                            showActionMenu === user.id ? null : user.id,
                          );
                        }}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                      </button>

                      {showActionMenu === user.id && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 z-50 text-left">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                onViewDetails(user);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              View Full Details
                            </button>
                            <button
                              onClick={() => {
                                onViewActivityLog(user);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                              <Activity className="w-4 h-4" />
                              View Activity Log
                            </button>
                            <button
                              onClick={() => {
                                onEditUser(user);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit User
                            </button>
                            <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>

                            {/* Subscription Management */}
                            <div className="px-4 py-2">
                              <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-2">
                                Subscription
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    onUpdateSubscription(user.id, 'Free');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex-1 px-2 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg transition-colors font-medium text-center"
                                >
                                  Free
                                </button>
                                <button
                                  onClick={() => {
                                    onUpdateSubscription(user.id, 'Premium');
                                    setShowActionMenu(null);
                                  }}
                                  className="flex-1 px-2 py-1.5 text-xs bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg transition-colors font-medium text-center"
                                >
                                  Premium
                                </button>
                                <button
                                  onClick={() => {
                                    onManageSubscription(user);
                                    setShowActionMenu(null);
                                  }}
                                  className="px-2 py-1.5 text-xs bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-400 rounded-lg transition-colors font-medium flex items-center justify-center"
                                  title="Manage Subscription"
                                >
                                  <Settings size={14} />
                                </button>
                              </div>
                            </div>

                            <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>

                            <button
                              onClick={() => {
                                if (user.email) {
                                  onResetPassword(user.id, user.email);
                                  setShowActionMenu(null);
                                } else {
                                  toast.error('User has no email address');
                                  setShowActionMenu(null);
                                }
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                              Reset Password
                            </button>

                            <button
                              onClick={() => {
                                onUpdateStatus(
                                  user.id,
                                  user.status === 'Active'
                                    ? 'Inactive'
                                    : 'Active',
                                );
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                              {user.status === 'Active' ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                              {user.status === 'Active'
                                ? 'Deactivate'
                                : 'Activate'}
                            </button>
                            <button
                              onClick={() => {
                                onUpdateStatus(user.id, 'Suspended');
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-3 text-neutral-700 dark:text-neutral-300 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                              Suspend User
                            </button>
                            <div className="border-t border-neutral-200 dark:border-neutral-700 my-2"></div>
                            <button
                              onClick={() => {
                                onDeleteUser(user.id);
                                setShowActionMenu(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-3 text-rose-600 dark:text-rose-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete User
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
