'use client';

import { useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';
import UserAvatar from '@/components/student/ui/common/UserAvatar';
import { uploadAvatar } from '@/services/storage-service';
import { getErrorMessage } from '@/lib/error-utils';

interface TeacherSettingsViewProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => void;
}

const cardClass =
  'bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden';
const headerClass =
  'px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between';
const headerTitleClass =
  'text-lg font-bold text-neutral-800 dark:text-neutral-100';
const bodyClass = 'p-6 space-y-6';
const inputGroupClass = 'space-y-2';
const labelClass =
  'block text-sm font-medium text-neutral-600 dark:text-neutral-400';
const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-neutral-800 dark:text-neutral-200';
const selectClass =
  'w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-neutral-800 dark:text-neutral-200 appearance-none';

const TeacherSettingsView: React.FC<TeacherSettingsViewProps> = ({
  user,
  onSave,
}) => {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);

  const [formData, setFormData] = useState({
    name: user.name || '',
    dob: user.dob || '',
    gender: user.gender || '',
    address: user.address || '',
    institute: user.institute || '',
    email: user.email || '',
    phone: user.phone || '',
    bio: user.bio || '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ছবি ২ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    setUploading(true);

    try {
      const result = await uploadAvatar(file);
      if (onSave) onSave({ avatarUrl: result.url });
      setAvatarUrl(result.url);
      toast.success('সফলভাবে প্রোফাইল ছবি পরিবর্তন করা হয়েছে!');
    } catch (error: unknown) {
      console.error('Upload Error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('নাম লেখা আবশ্যক!');
      return false;
    }
    const phoneRegex = /^01\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error('সঠিক 11 ডিজিটের ফোন নম্বর দিন');
      return false;
    }
    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না!');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload = {
      name: formData.name,
      dob: formData.dob || null,
      gender: formData.gender || null,
      address: formData.address || null,
      institute: formData.institute || null,
      bio: formData.bio || null,
      phone: formData.phone || null,
      avatar_url: avatarUrl || null,
    };

    try {
      const supabase = createClient();

      if (formData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });
        if (passwordError) throw passwordError;
        toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      }

      if (onSave) {
        onSave({
          ...payload,
          phone: payload.phone ?? undefined,
          dob: payload.dob ?? undefined,
          gender: payload.gender ?? undefined,
          address: payload.address ?? undefined,
          institute: payload.institute ?? undefined,
          bio: payload.bio ?? undefined,
          avatarUrl: payload.avatar_url ?? undefined,
        });
        toast.success('সেটিংস সফলভাবে সেভ করা হয়েছে!');
      } else {
        const { error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', user.id);
        if (error) throw error;
        toast.success('সেটিংস সফলভাবে সেভ করা হয়েছে!');
      }

      setFormData((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      console.error('Save Error:', error);
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-24 space-y-6">
      {/* ── Page Header ── */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/10 mb-8">
        <h1 className="text-2xl font-bold mb-2">সেটিংস</h1>
        <p className="text-emerald-100 text-sm">
          আপনার ব্যক্তিগত এবং পেশাগত তথ্য এখানে আপডেট করুন।
        </p>
      </div>

      {/* Personal Info */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>ব্যক্তিগত তথ্য</h3>
          <div className="relative group cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
              disabled={uploading}
            />
            <label
              htmlFor="avatar-upload"
              className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 cursor-pointer transition-colors"
            >
              {uploading ? 'Uploading...' : 'ছবি পরিবর্তন করুন'}
              <Camera className="w-4 h-4" />
            </label>
          </div>
        </div>

        <div className={bodyClass}>
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="relative group">
              <UserAvatar
                user={{ ...user, avatarUrl: avatarUrl }}
                size="2xl"
                showBorder
                className="transition-transform duration-300 group-hover:scale-[1.02] ring-4 ring-emerald-50 dark:ring-emerald-900/20"
              />

              <label
                htmlFor="avatar-upload"
                className={`
                  absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer
                  ${uploading ? 'pointer-events-none' : ''}
                `}
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                ) : (
                  <Camera className="w-8 h-8 text-white/80" />
                )}
              </label>
            </div>

            {avatarUrl && (
              <button
                onClick={() => {
                  setAvatarUrl(undefined);
                  onSave?.({ avatarUrl: undefined });
                  toast.success('ছবি সরিয়ে নেওয়া হয়েছে।');
                }}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ছবি সরিয়ে ফেলুন
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={inputGroupClass}>
              <label className={labelClass}>নাম</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="আপনার পূর্ণ নাম লিখুন"
              />
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}>
                ফোন নম্বর
                {user.phone && (
                  <span className="text-xs text-emerald-600 ml-2">
                    (ভেরিফাইড)
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`${inputClass} ${
                    user.phone
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : ''
                  }`}
                  placeholder="০১XXXXXXXXX"
                  maxLength={11}
                  readOnly={!!user.phone}
                  disabled={!!user.phone}
                />
              </div>
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}>জন্ম তারিখ</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div className={inputGroupClass}>
              <label className={labelClass}>লিঙ্গ (Gender)</label>
              <div className="relative">
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="">নির্বাচন করুন</option>
                  <option value="Male">পুরুষ (Male)</option>
                  <option value="Female">মহিলা (Female)</option>
                </select>
              </div>
            </div>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>ঠিকানা</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className={inputClass}
              placeholder="বর্তমান ঠিকানা..."
            />
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>সংক্ষিপ্ত পরিচিতি (Bio)</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className={inputClass}
              placeholder="আপনার সম্পর্কে কিছু লিখুন..."
            />
          </div>
        </div>
      </div>

      {/* Professional Info */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>পেশাগত তথ্য</h3>
        </div>
        <div className={bodyClass}>
          <div className={inputGroupClass}>
            <label className={labelClass}>শিক্ষা প্রতিষ্ঠানের নাম</label>
            <input
              type="text"
              name="institute"
              value={formData.institute}
              onChange={handleChange}
              className={inputClass}
              placeholder="আপনার শিক্ষা প্রতিষ্ঠানের নাম লিখুন..."
            />
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>অ্যাকাউন্ট সেটিংস</h3>
        </div>
        <div className={bodyClass}>
          <div className={inputGroupClass}>
            <label className={labelClass}>ইমেইল</label>
            <input
              type="email"
              value={formData.email}
              readOnly
              className={`${inputClass} bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed`}
            />
          </div>
          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <h4 className="text-sm font-bold mb-4 text-emerald-800 dark:text-emerald-400">
              পাসওয়ার্ড পরিবর্তন (অপশনাল)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={inputGroupClass}>
                <label className={labelClass}>নতুন পাসওয়ার্ড</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="নূন্যতম ৬ টি অক্ষর"
                />
              </div>
              <div className={inputGroupClass}>
                <label className={labelClass}>পাসওয়ার্ড নিশ্চিত করুন</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-6 right-6 lg:right-10 z-30">
        <button
          onClick={handleSubmit}
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-lg hover:shadow-red-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
        >
          সেভ করুন
        </button>
      </div>
    </div>
  );
};

export default TeacherSettingsView;
