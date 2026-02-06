'use client';

import React, { useEffect, useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Award,
  BookOpen,
  Activity,
  User,
  Shield,
  Clock,
} from 'lucide-react';
import { getUserProfile } from '@/services/database';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';
import EditProfileModal from '@/components/admin/profile/EditProfileModal';

export default function AdminProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await getUserProfile('me');
      setUser(data);
    } catch (error) {
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={user}
        onUpdate={fetchProfile}
      />

      {/* 1. Profile Banner & Header Card */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-obsidian-900 shadow-xl border border-paper-200 dark:border-obsidian-800">
        {/* Banner Image */}
        <div className="h-48 bg-gradient-to-r from-brand-500 to-rose-600 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-4 right-4">
            <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2">
              <Edit2 size={14} /> Edit Cover
            </button>
          </div>
        </div>

        {/* Profile Info Wrapper */}
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-16">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-obsidian-900 bg-white dark:bg-obsidian-800 shadow-lg overflow-hidden flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-100 to-rose-100 dark:from-brand-900 dark:to-rose-900 flex items-center justify-center text-4xl font-bold text-brand-600 dark:text-brand-400">
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute bottom-2 right-2 bg-brand-500 text-white p-2 rounded-full shadow-lg hover:bg-brand-600 transition-colors"
              >
                <Edit2 size={16} />
              </button>
            </div>

            {/* Name & Role */}
            <div className="flex-1 pt-16 md:pt-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-paper-900 dark:text-white">
                    {user?.name || 'Admin User'}
                  </h1>
                  <p className="text-paper-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <Shield size={16} className="text-brand-500" />
                    {user?.role || 'Super Administrator'}
                    <span className="w-1.5 h-1.5 rounded-full bg-paper-300 dark:bg-gray-600"></span>
                    <span className="text-green-500 font-medium">Active</span>
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="px-6 py-2 bg-gray-100 border border-gray-200 dark:bg-obsidian-800 dark:border-obsidian-700 text-gray-900 dark:text-white rounded-xl hover:bg-gray-200 dark:hover:bg-obsidian-700 transition-colors font-medium">
                    Settings
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-6 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-all font-medium"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Personal Information (Left Column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-obsidian-900 rounded-2xl p-6 shadow-sm border border-paper-200 dark:border-obsidian-800">
            <h3 className="text-lg font-bold text-paper-900 dark:text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-brand-500" />
              About Me
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 border border-gray-100 dark:bg-obsidian-800/50 dark:border-obsidian-700/50">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs text-paper-500 dark:text-gray-500 uppercase font-semibold">
                    Email
                  </p>
                  <p className="text-sm font-medium text-paper-900 dark:text-gray-200">
                    {user?.email || 'Not Provided'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-paper-50 dark:bg-obsidian-800/50">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs text-paper-500 dark:text-gray-500 uppercase font-semibold">
                    Phone
                  </p>
                  <p className="text-sm font-medium text-paper-900 dark:text-gray-200">
                    {user?.phone || 'Not Set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-paper-50 dark:bg-obsidian-800/50">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-xs text-paper-500 dark:text-gray-500 uppercase font-semibold">
                    Location
                  </p>
                  <p className="text-sm font-medium text-paper-900 dark:text-gray-200">
                    {user?.address || 'Not Set'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-paper-50 dark:bg-obsidian-800/50">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs text-paper-500 dark:text-gray-500 uppercase font-semibold">
                    Joined
                  </p>
                  <p className="text-sm font-medium text-paper-900 dark:text-gray-200">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-paper-100 dark:border-obsidian-800">
              <h4 className="text-sm font-semibold text-paper-900 dark:text-white mb-3">
                Bio
              </h4>
              <p className="text-sm text-paper-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                {user?.bio ||
                  'No bio provided yet. Click "Edit Profile" to add details about yourself.'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Stats & Activity (Right Column - Spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-obsidian-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-obsidian-800 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-paper-900 dark:text-white">
                  128
                </p>
                <p className="text-xs text-paper-500 dark:text-gray-400 font-medium">
                  Actions Today
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-obsidian-900 p-5 rounded-2xl shadow-sm border border-paper-200 dark:border-obsidian-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-paper-900 dark:text-white">
                  24
                </p>
                <p className="text-xs text-paper-500 dark:text-gray-400 font-medium">
                  Pending Reviews
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-obsidian-900 p-5 rounded-2xl shadow-sm border border-paper-200 dark:border-obsidian-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Award size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-paper-900 dark:text-white">
                  Active
                </p>
                <p className="text-xs text-paper-500 dark:text-gray-400 font-medium">
                  Team Status
                </p>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-obsidian-900 rounded-2xl shadow-sm border border-paper-200 dark:border-obsidian-800 flex-1">
            <div className="p-6 border-b border-paper-100 dark:border-obsidian-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-paper-900 dark:text-white flex items-center gap-2">
                <Clock size={20} className="text-brand-500" />
                Recent Activity
              </h3>
              <button className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                View All
              </button>
            </div>
            <div className="p-6">
              {/* Mock Activity List */}
              <div className="relative pl-6 border-l-2 border-paper-100 dark:border-obsidian-800 space-y-8">
                {[
                  {
                    title: 'Approved 5 Manual Payments',
                    time: '2 hours ago',
                    type: 'payment',
                    desc: 'Verified transactions for student subscriptions.',
                  },
                  {
                    title: 'Updated System Settings',
                    time: '5 hours ago',
                    type: 'system',
                    desc: 'Changed default language settings for new users.',
                  },
                  {
                    title: 'Resolved 3 User Reports',
                    time: 'Yesterday',
                    type: 'report',
                    desc: 'Addressed question error reports in Physics 1st Paper.',
                  },
                  {
                    title: 'Created New Question Bank',
                    time: '2 days ago',
                    type: 'content',
                    desc: 'Added 50 new questions to Biology chapter.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 border-white dark:border-obsidian-900 shadow-sm
                              ${item.type === 'payment' ? 'bg-green-500' : ''}
                              ${item.type === 'system' ? 'bg-blue-500' : ''}
                              ${item.type === 'report' ? 'bg-orange-500' : ''}
                              ${item.type === 'content' ? 'bg-purple-500' : ''}
                           `}
                    ></span>
                    <div>
                      <p className="text-sm font-semibold text-paper-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-paper-400 dark:text-gray-500 mb-1">
                        {item.time}
                      </p>
                      <p className="text-sm text-paper-600 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
