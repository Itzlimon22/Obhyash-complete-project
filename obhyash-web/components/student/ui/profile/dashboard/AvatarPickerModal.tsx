'use client';

import React, { useState, useRef } from 'react';
import {
  Sparkles,
  User,
  UserCheck,
  Glasses,
  Zap,
  Bot,
  Camera,
  Check,
  Loader2,
  X,
  Upload,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { uploadAvatar } from '@/services/storage-service';
import { toast } from 'sonner';
import Image from 'next/image';

interface AvatarPickerModalProps {
  user: UserProfile;
  onClose: () => void;
  onAvatarUpdated?: (newUrl: string) => void;
}

interface AvatarCategory {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface PresetItem {
  url: string;
  title: string;
  categoryId: string;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  user,
  onClose,
  onAvatarUpdated,
}) => {
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(
    user.avatarUrl || null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories: AvatarCategory[] = [
    { id: 'all', label: 'সব', icon: Sparkles },
    { id: 'boys', label: 'ছাত্র', icon: User },
    { id: 'girls', label: 'ছাত্রী', icon: UserCheck },
    { id: 'scholars', label: 'টপার ও স্কলার', icon: Glasses },
    { id: 'anime', label: 'অ্যানিমে', icon: Zap },
    { id: 'mascots', label: 'ম্যাসকট ও বট', icon: Bot },
  ];

  const seedBase = user.id ? user.id.slice(0, 4) : 'obh';

  const presets: PresetItem[] = [
    // Boys
    {
      url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedBase}_b1&backgroundColor=b6e3f4`,
      title: 'ছাত্র ১',
      categoryId: 'boys',
    },
    {
      url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedBase}_b2&backgroundColor=c0aede`,
      title: 'ছাত্র ২',
      categoryId: 'boys',
    },
    {
      url: `https://api.dicebear.com/7.x/personas/svg?seed=${seedBase}_b3&backgroundColor=d1d4f9`,
      title: 'ছাত্র ৩',
      categoryId: 'boys',
    },
    {
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedBase}_b4&backgroundColor=b6e3f4`,
      title: 'ছাত্র ৪',
      categoryId: 'boys',
    },
    // Girls
    {
      url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${seedBase}_g1&backgroundColor=ffd5dc`,
      title: 'ছাত্রী ১',
      categoryId: 'girls',
    },
    {
      url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${seedBase}_g2&backgroundColor=ffdfbf`,
      title: 'ছাত্রী ২',
      categoryId: 'girls',
    },
    {
      url: `https://api.dicebear.com/7.x/personas/svg?seed=${seedBase}_g3&backgroundColor=ffd5dc`,
      title: 'ছাত্রী ৩',
      categoryId: 'girls',
    },
    {
      url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedBase}_g4&backgroundColor=ffd5dc`,
      title: 'ছাত্রী ৪',
      categoryId: 'girls',
    },
    // Scholars
    {
      url: `https://api.dicebear.com/7.x/personas/svg?seed=${seedBase}_s1&backgroundColor=c0aede`,
      title: 'স্কলার ১',
      categoryId: 'scholars',
    },
    {
      url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${seedBase}_s2&backgroundColor=d1d4f9`,
      title: 'স্কলার ২',
      categoryId: 'scholars',
    },
    {
      url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedBase}_s3&backgroundColor=b6e3f4`,
      title: 'স্কলার ৩',
      categoryId: 'scholars',
    },
    // Anime
    {
      url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seedBase}_a1&backgroundColor=ffd5dc`,
      title: 'অ্যানিমে ১',
      categoryId: 'anime',
    },
    {
      url: `https://api.dicebear.com/7.x/lorelei/svg?seed=${seedBase}_a2&backgroundColor=c0aede`,
      title: 'অ্যানিমে ২',
      categoryId: 'anime',
    },
    {
      url: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seedBase}_a3&backgroundColor=ffdfbf`,
      title: 'অ্যানিমে ৩',
      categoryId: 'anime',
    },
    // Mascots
    {
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seedBase}_m1&backgroundColor=b6e3f4`,
      title: 'বট ১',
      categoryId: 'mascots',
    },
    {
      url: `https://api.dicebear.com/7.x/bottts/svg?seed=${seedBase}_m2&backgroundColor=c0aede`,
      title: 'বট ২',
      categoryId: 'mascots',
    },
    {
      url: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${seedBase}_m3&backgroundColor=ffd5dc`,
      title: 'ইমোজি',
      categoryId: 'mascots',
    },
  ];

  const filteredPresets = presets.filter(
    (p) => selectedCategory === 'all' || p.categoryId === selectedCategory
  );

  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('অনুগ্রহ করে একটি ছবি ফাইল নির্বাচন করুন');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ ৫MB এর কম হতে হবে');
      return;
    }

    setIsUploadingCustom(true);
    try {
      const res = await uploadAvatar(file);
      setSelectedAvatarUrl(res.url);
      toast.success('ছবি সফলভাবে আপলোড হয়েছে!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'ছবি আপলোড করতে ব্যর্থ হয়েছে');
    } finally {
      setIsUploadingCustom(false);
    }
  };

  const handleSave = async () => {
    if (!selectedAvatarUrl) return;

    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: selectedAvatarUrl })
        .eq('id', user.id);

      if (error) throw error;

      // Update local storage cached profile
      try {
        const cached = localStorage.getItem('obhyash_user_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          parsed.avatarUrl = selectedAvatarUrl;
          parsed.avatar_url = selectedAvatarUrl;
          localStorage.setItem('obhyash_user_profile', JSON.stringify(parsed));
        }
      } catch (_) {}

      toast.success('প্রোফাইল ছবি সফলভাবে আপডেট করা হয়েছে!');
      onAvatarUpdated?.(selectedAvatarUrl);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'আপডেট করতে ব্যর্থ হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#141210] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl border border-neutral-200 dark:border-[#27272A] font-['HindSiliguri',sans-serif] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-11 h-1 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white leading-tight">
              অ্যাভাটার নির্বাচন করো
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              পছন্দের চরিত্র নির্বাচন করো অথবা নিজের ছবি আপলোড করো
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1C1C1E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Upload Button Banner */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingCustom}
            className="w-full p-3 rounded-[16px] bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm hover:bg-emerald-100/50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
          >
            {isUploadingCustom ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>গ্যালারি থেকে নিজের ছবি আপলোড করো</span>
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar shrink-0">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all shrink-0 cursor-pointer
                  ${
                    isSelected
                      ? 'bg-[#059669] text-white shadow-xs'
                      : 'bg-neutral-100 dark:bg-[#1C1C1E] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-[#252528]'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Preset Avatars Grid */}
        <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-4 sm:grid-cols-4 gap-3 py-2">
          {filteredPresets.map((preset, idx) => {
            const isSelected = selectedAvatarUrl === preset.url;
            return (
              <div
                key={idx}
                onClick={() => setSelectedAvatarUrl(preset.url)}
                className={`
                  relative aspect-square rounded-[18px] p-1.5 border-2 cursor-pointer transition-all flex flex-col items-center justify-center overflow-hidden
                  ${
                    isSelected
                      ? 'border-[#059669] bg-emerald-50/50 dark:bg-emerald-950/20 scale-105 shadow-md'
                      : 'border-neutral-200 dark:border-[#27272A] bg-neutral-50 dark:bg-[#1C1C1E] hover:border-emerald-500/50'
                  }
                `}
              >
                <img
                  src={preset.url}
                  alt={preset.title}
                  className="w-full h-full object-contain rounded-full"
                />
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Save / Apply Button */}
        <div className="pt-4 border-t border-neutral-100 dark:border-[#27272A] mt-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedAvatarUrl}
            className="w-full h-12 rounded-[16px] bg-[#059669] hover:bg-[#047857] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span>প্রোফাইল ছবি সেট করো</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarPickerModal;
