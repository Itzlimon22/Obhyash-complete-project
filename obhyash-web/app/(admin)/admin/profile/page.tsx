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
    <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUser={user}
        onUpdate={fetchProfile}
      />

      {/* 1. Profile Banner & Header Card */}
      <div className="relative rounded-[2.5rem] overflow-hidden bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200 dark:border-neutral-800">
        {/* Banner Image */}
        <div className="h-32 sm:h-48 bg-gradient-to-r from-red-600 to-red-400 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute top-4 right-4">
            <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white p-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2">
              <Edit2 size={14} />
              <span className="hidden sm:inline">ব্যানার পরিবর্তন</span>
            </button>
          </div>
        </div>

        {/* Profile Info Wrapper */}
        <div className="px-6 sm:px-10 pb-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 items-center sm:items-start -mt-12 sm:mt-[-4rem]">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-[2rem] border-4 border-white dark:border-neutral-900 bg-white dark:bg-neutral-800 shadow-xl overflow-hidden flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 flex items-center justify-center text-5xl font-black text-red-600 dark:text-red-400">
                    {user?.name?.[0]?.toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="absolute -bottom-1 -right-1 bg-white dark:bg-neutral-800 text-red-600 p-2.5 rounded-2xl shadow-xl hover:bg-red-50 dark:hover:bg-red-900/50 transition-all border border-neutral-100 dark:border-neutral-700 active:scale-90"
              >
                <Edit2 size={16} strokeWidth={3} />
              </button>
            </div>

            {/* Name & Role */}
            <div className="flex-1 pt-4 sm:pt-20 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    {user?.name || 'অ্যাডমিন ইউজার'}
                  </h1>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="px-3 py-1 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-[0.2em] border border-red-100 dark:border-red-500/20">
                      {user?.role === 'Admin'
                        ? 'সুপার অ্যাডমিন'
                        : 'অ্যাডমিনিস্ট্রেটর'}
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest pl-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      সক্রিয়
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <button className="flex-1 sm:flex-none px-6 py-3.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-2xl hover:bg-neutral-200 transition-all font-black text-xs uppercase tracking-widest active:scale-95">
                    সেটিংস
                  </button>
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex-1 sm:flex-none px-6 py-3.5 bg-red-600 text-white rounded-2xl hover:bg-red-700 shadow-xl shadow-red-500/30 transition-all font-black text-xs uppercase tracking-widest active:scale-95"
                  >
                    প্রোফাইল এডিট
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
          <div className="bg-white dark:bg-neutral-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-8 flex items-center gap-3">
              <span className="p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl">
                <User size={20} />
              </span>
              আমার সম্পর্কে
            </h3>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 transition-all hover:border-emerald-100 dark:hover:border-emerald-900/30 group">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-transform group-hover:scale-110">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-black tracking-widest leading-none mb-1.5">
                    ইমেইল
                  </p>
                  <p className="text-sm font-black text-neutral-900 dark:text-neutral-200 truncate">
                    {user?.email || 'ব্যক্তিগত তথ্য'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 transition-all hover:border-emerald-100 dark:hover:border-emerald-900/30 group">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-transform group-hover:scale-110">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-black tracking-widest leading-none mb-1.5">
                    ফোন
                  </p>
                  <p className="text-sm font-black text-neutral-900 dark:text-neutral-200">
                    {user?.phone || '০১৭XXXXXXXX'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 transition-all hover:border-emerald-100 dark:hover:border-emerald-900/30 group">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-transform group-hover:scale-110">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-black tracking-widest leading-none mb-1.5">
                    ঠিকানা
                  </p>
                  <p className="text-sm font-black text-neutral-900 dark:text-neutral-200 truncate">
                    {user?.address || 'তথ্য প্রদান করা হয়নি'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 transition-all hover:border-emerald-100 dark:hover:border-emerald-900/30 group">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-transform group-hover:scale-110">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase font-black tracking-widest leading-none mb-1.5">
                    জয়েন করেছেন
                  </p>
                  <p className="text-sm font-black text-neutral-900 dark:text-neutral-200">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('bn-BD', {
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'জানুয়ারি ২০২৪'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-3.5 ml-1">
                বায়ো (Bio)
              </h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium bg-neutral-50 dark:bg-black/20 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/50 italic">
                {user?.bio ||
                  'আপনার সম্পর্কে আরও তথ্য দিতে প্রোফাইল এডিট করুন।'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Stats & Activity (Right Column - Spans 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-100 dark:border-neutral-800 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center transition-transform group-hover:scale-110">
                <Activity size={24} />
              </div>
              <div className="mt-6">
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white leading-none">
                  ১২৮
                </p>
                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-2 leading-none">
                  আজকের অ্যাকশন
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-100 dark:border-neutral-800 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                <BookOpen size={24} />
              </div>
              <div className="mt-6">
                <p className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white leading-none">
                  ২৪
                </p>
                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-2 leading-none">
                  বাকি রিভিউ
                </p>
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 bg-white dark:bg-neutral-900 p-6 rounded-[2rem] shadow-sm border border-neutral-100 dark:border-neutral-800 transition-all hover:shadow-md group flex sm:block items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                <Award size={24} />
              </div>
              <div className="sm:mt-6 text-right sm:text-left">
                <p className="text-2xl sm:text-3xl font-black text-emerald-500 leading-none">
                  সক্রিয়
                </p>
                <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-2 leading-none">
                  টিম স্ট্যাটাস
                </p>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-sm border border-neutral-200 dark:border-neutral-800 flex-1 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center transition-all bg-neutral-50/50 dark:bg-neutral-800/20">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-red-600 text-white rounded-xl shadow-lg shadow-red-500/20">
                  <Clock size={20} />
                </span>
                <h3 className="text-lg font-black text-neutral-900 dark:text-white tracking-tight">
                  সাম্প্রতিক অ্যাক্টিভিটি
                </h3>
              </div>
              <button className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] hover:text-red-700">
                সব দেখুন
              </button>
            </div>
            <div className="p-6 sm:p-10">
              {/* Activity List */}
              <div className="relative pl-8 border-l-4 border-neutral-100 dark:border-neutral-800 space-y-10 ml-2">
                {[
                  {
                    title: '৫টি ম্যানুয়াল পেমেন্ট অ্যাপ্রুভ করেছেন',
                    time: '২ ঘণ্টা আগে',
                    type: 'payment',
                    desc: 'শিক্ষার্থীদের সাবস্ক্রিপশন ট্রানজ্যাকশন ভেরিফাই করা হয়েছে।',
                  },
                  {
                    title: 'সিস্টেম সেটিংস আপডেট করেছেন',
                    time: '৫ ঘণ্টা আগে',
                    type: 'system',
                    desc: 'নতুন ব্যবহারকারীদের জন্য ডিফল্ট ভাষা পরিবর্তন করা হয়েছে।',
                  },
                  {
                    title: '৩টি ইউজার রিপোর্ট সমাধান করেছেন',
                    time: 'গতকাল',
                    type: 'report',
                    desc: 'পদার্থবিজ্ঞান ১ম পত্রের প্রশ্নের ভুল সংশোধন করা হয়েছে।',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="relative group">
                    <span
                      className={`absolute -left-[40px] top-0 w-5 h-5 rounded-full border-4 border-white dark:border-neutral-900 shadow-xl transition-transform group-hover:scale-125
                              ${item.type === 'payment' ? 'bg-emerald-500' : ''}
                              ${item.type === 'system' ? 'bg-emerald-500' : ''}
                              ${item.type === 'report' ? 'bg-red-500' : ''}
                           `}
                    ></span>
                    <div className="space-y-1.5 transition-all group-hover:translate-x-2">
                      <p className="text-sm font-black text-neutral-900 dark:text-white leading-tight">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest pl-0.5">
                        {item.time}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed max-w-lg">
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
