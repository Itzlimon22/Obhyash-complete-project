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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-obsidian-900 rounded-2xl shadow-2xl w-full max-w-lg border border-paper-200 dark:border-obsidian-800 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-paper-100 dark:border-obsidian-800">
          <h2 className="text-xl font-bold text-paper-900 dark:text-white">
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-paper-100 dark:hover:bg-obsidian-800 rounded-full transition-colors text-paper-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-paper-700 dark:text-gray-300 flex items-center gap-2">
              <User size={16} className="text-brand-500" />
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-paper-50 dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-paper-900 dark:text-white"
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Phone Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-paper-700 dark:text-gray-300 flex items-center gap-2">
              <Phone size={16} className="text-brand-500" />
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-paper-50 dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-paper-900 dark:text-white"
              placeholder="+880 1XXX XXXXXX"
            />
          </div>

          {/* Address Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-paper-700 dark:text-gray-300 flex items-center gap-2">
              <MapPin size={16} className="text-brand-500" />
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-paper-50 dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-paper-900 dark:text-white"
              placeholder="Your location"
            />
          </div>

          {/* Bio Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-paper-700 dark:text-gray-300 flex items-center gap-2">
              <FileText size={16} className="text-brand-500" />
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl bg-paper-50 dark:bg-obsidian-800 border border-paper-200 dark:border-obsidian-700 focus:ring-2 focus:ring-brand-500 outline-none text-paper-900 dark:text-white resize-none"
              placeholder="Tell us a little about yourself"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-paper-600 dark:text-gray-300 font-medium hover:bg-paper-100 dark:hover:bg-obsidian-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-brand-500 text-white font-medium rounded-xl hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
