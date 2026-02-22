'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/lib/types';
import { updateUserProfile } from '@/services/database';
import { X, Save, User, Phone, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onUpdate: () => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  currentUser,
  onUpdate,
}: EditProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    bio: '',
  });

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.name.trim() || formData.name.length > 50) {
      toast.error('নাম ৫০ অক্ষরের মধ্যে হতে হবে');
      return;
    }
    if (formData.phone && formData.phone.length > 15) {
      toast.error('ফোন নম্বর 11 অক্ষরের মধ্যে হতে হবে');
      return;
    }
    if (formData.address && formData.address.length > 150) {
      toast.error('ঠিকানা ১৫০ অক্ষরের মধ্যে হতে হবে');
      return;
    }
    if (formData.bio && formData.bio.length > 300) {
      toast.error('বায়ো ৩০০ অক্ষরের মধ্যে হতে হবে');
      return;
    }

    setLoading(true);
    try {
      const updatedUser: UserProfile = {
        ...currentUser,
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        bio: formData.bio,
      };

      const result = await updateUserProfile(updatedUser);

      if (result.success) {
        toast.success('Profile updated successfully');
        onUpdate();
        onClose();
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-neutral-900 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg border-x border-t sm:border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 overflow-hidden">
        <div className="flex items-center justify-between p-6 sm:p-8 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-500/20">
              <User size={20} />
            </span>
            <h2 className="text-xl font-black text-neutral-900 dark:text-white tracking-tight">
              প্রোফাইল এডিট
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-2xl transition-all text-neutral-500 active:scale-90"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 space-y-6 overflow-y-auto max-h-[80vh] sm:max-h-none"
        >
          {/* Name Field */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              পুরো নাম
            </label>
            <div className="relative group">
              <User
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-rose-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-neutral-900 dark:text-white font-black text-sm transition-all"
                placeholder="আপনার নাম লেখো"
                required
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              ফোন নম্বর
            </label>
            <div className="relative group">
              <Phone
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-rose-500 transition-colors"
                size={18}
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-neutral-900 dark:text-white font-black text-sm transition-all"
                placeholder="০১XXXXXXXXX"
              />
            </div>
          </div>

          {/* Address Field */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              ঠিকানা
            </label>
            <div className="relative group">
              <MapPin
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-rose-500 transition-colors"
                size={18}
              />
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-neutral-900 dark:text-white font-black text-sm transition-all"
                placeholder="আপনার বর্তমান অবস্থান"
              />
            </div>
          </div>

          {/* Bio Field */}
          <div className="space-y-2.5">
            <label className="text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2 ml-1">
              বায়ো (Bio)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={3}
              className="w-full px-5 py-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-neutral-900 dark:text-white font-medium text-sm transition-all resize-none"
              placeholder="আপনার সম্পর্কে কিছু লেখো"
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full order-first sm:order-last px-8 py-4 bg-rose-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-rose-700 shadow-xl shadow-rose-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} strokeWidth={3} />
              )}
              পরিবর্তন সংরক্ষণ করুন
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full px-8 py-4 text-neutral-500 font-black text-xs uppercase tracking-widest hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-2xl transition-all active:scale-95"
            >
              বাতিল
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
