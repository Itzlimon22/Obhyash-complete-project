import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { User as UserType } from '@/hooks/useUserManagement';

interface DetailsModalProps {
  user: UserType;
  isOpen: boolean;
  onClose: () => void;
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-violet-600 p-6 rounded-t-2xl flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6" />
              User Details
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Full profile information
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* content */}
        <div className="p-6 space-y-8">
          {/* Header Profile */}
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {user.name || 'Unnamed User'}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold uppercase tracking-wider">
                  {user.role}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                    user.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {user.status}
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2">
                Contact Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <Mail className="w-5 h-5 text-neutral-400" />
                  <span>{user.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <Phone className="w-5 h-5 text-neutral-400" />
                  <span>{user.phone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2">
                Academic Details
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <GraduationCap className="w-5 h-5 text-neutral-400" />
                  <span>{user.institute || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <MapPin className="w-5 h-5 text-neutral-400" />
                  <span>{user.division || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <Layers className="w-5 h-5 text-neutral-400" />
                  <span>Batch: {user.batch || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2">
                Account Stats
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <Calendar className="w-5 h-5 text-neutral-400" />
                  <span>
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-400">
                  <Shield className="w-5 h-5 text-neutral-400" />
                  <span>Exams Taken: {user.exams_taken}</span>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-white uppercase tracking-wider border-b border-neutral-200 dark:border-neutral-800 pb-2">
                Subscription
              </h4>
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Current Plan
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      user.subscription?.plan === 'Premium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {user.subscription?.plan || 'Free'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    Status
                  </span>
                  <span className="text-sm text-neutral-900 dark:text-white capitalize">
                    {user.subscription?.status || 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white font-medium rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailsModal;
