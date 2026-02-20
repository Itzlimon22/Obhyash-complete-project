'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '@/components/auth/AuthProvider';

import { uploadAvatar } from '@/services/storage-service';
import { getErrorMessage } from '@/lib/error-utils';

interface SettingsViewProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => void;
}

type SettingsUpdatePayload = {
  name: string;
  dob: string | null;
  gender: string | null;
  address: string | null;
  institute: string;
  stream: string;
  division: string;
  batch: string;
  target: string;
  ssc_roll: string;
  ssc_reg: string;
  ssc_board: string;
  ssc_passing_year: string;
  optional_subject: string;
  phone: string | null;
  avatar_url: string | null;
};

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

const SettingsView: React.FC<SettingsViewProps> = ({ user, onSave }) => {
  // No large header to remove here, but ensuring top spacing is correct

  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl); // Local state for immediate preview

  const [showPassword, setShowPassword] = useState(false);

  // Account Linking State
  const { user: currentUser } = useAuth();
  const [isLinking, setIsLinking] = useState(false);
  const isGoogleLinked = currentUser?.identities?.some(
    (identity) => identity.provider === 'google',
  );

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    const supabase = createClient();
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      // Redirect happens automatically
    } catch (error: unknown) {
      console.error('Linking error:', error);
      toast.error(getErrorMessage(error));
      setIsLinking(false);
    }
  };

  const [formData, setFormData] = useState({
    name: user.name || '',
    dob: user.dob || '',
    gender: user.gender || '',
    address: user.address || '',
    institute: user.institute || '',
    stream: user.stream || 'HSC', // New stream column
    group: user.division || 'Science',
    batch: user.batch || 'HSC 2025',
    target: user.target || '',
    sscRoll: user.ssc_roll || '',
    sscReg: user.ssc_reg || '',
    sscBoard: user.ssc_board || 'Dhaka',
    sscYear: user.ssc_passing_year || '2023',
    optionalSubject: user.optional_subject || '',
    email: user.email || '',
    phone: user.phone || '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }

    const file = e.target.files[0];

    // Size limit check: 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ছবি ২ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    setUploading(true);

    try {
      console.log('🔄 Uploading avatar to Supabase...');
      const result = await uploadAvatar(file);

      console.log('✅ Avatar uploaded:', result.url);

      // 3. Update Parent State & DB via onSave
      if (onSave) {
        onSave({ avatarUrl: result.url });
      }

      setAvatarUrl(result.url);
      toast.success('সফলভাবে প্রোফাইল ছবি পরিবর্তন করা হয়েছে!', {
        position: 'top-center',
        className: 'font-bengali',
      });
    } catch (error: unknown) {
      console.error('Upload Error:', error);
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    // Name validation
    if (!formData.name.trim()) {
      toast.error('নাম লেখা আবশ্যক!');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      toast.error('সঠিক ইমেইল ঠিকানা দিন!');
      return false;
    }

    // Phone validation: exactly 11 digits, starts with 01
    const phoneRegex = /^01\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error('সঠিক 11 ডিজিটের ফোন নম্বর দিন');
      return false;
    }

    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না!', { position: 'top-center' });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const payload: SettingsUpdatePayload = {
      name: formData.name,
      dob: formData.dob || null,
      gender: formData.gender || null,
      address: formData.address || null,

      institute: formData.institute,
      stream: formData.stream,
      division: formData.group, // Saves to division column
      batch: formData.batch,
      target: formData.target,

      ssc_roll: formData.sscRoll,
      ssc_reg: formData.sscReg,
      ssc_board: formData.sscBoard,
      ssc_passing_year: formData.sscYear,
      optional_subject: formData.optionalSubject,
      phone: formData.phone || null,
      avatar_url: avatarUrl || null,
    };

    console.log('Saving Settings Payload:', payload);

    try {
      const supabase = createClient();

      if (formData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });

        if (passwordError) throw passwordError;
        toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!', {
          position: 'top-center',
        });
      }

      if (onSave) {
        // Convert to UserProfile compatibility (undefined instead of null for most fields)
        const uiUpdate = {
          ...payload,
          phone: payload.phone ?? undefined,
          dob: payload.dob ?? undefined,
          gender: payload.gender ?? undefined,
          address: payload.address ?? undefined,
          avatarUrl: payload.avatar_url ?? undefined,
        };
        onSave(uiUpdate);
        toast.success('সেটিংস সফলভাবে সেভ করা হয়েছে!', {
          position: 'top-center',
        });
      } else {
        const { error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', user.id);
        if (error) throw error;
        toast.success('সেটিংস সফলভাবে সেভ করা হয়েছে!', {
          position: 'top-center',
        });
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

  // ... Render ...
  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-24">
      {/* ... Header ... */}

      {/* Personal Info */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>ব্যক্তিগত তথ্য</h3>
          {/* File Input Trigger */}
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
              className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 cursor-pointer"
            >
              {uploading ? 'লোডিং...' : 'ছবি পরিবর্তন করো'}
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
                className="transition-transform duration-300 group-hover:scale-[1.02]"
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
                ছবি সরিয়ে ফেলো
              </button>
            )}

            <p className="mt-3 text-[10px] text-neutral-400 dark:text-neutral-500 max-w-[200px] text-center">
              JPG, PNG বা WEBP (সর্বোচ্চ ২ মেগাবাইট)
            </p>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>নাম</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              placeholder="তোমার পুরো নাম লেখো"
            />
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>
              ফোন নম্বর
              {user.phone && (
                <span className="text-xs text-rose-500 ml-2">
                  (পরিবর্তনযোগ্য নয়)
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
              {user.phone && (
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
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
            <label className={labelClass}>ছাত্র/ছাত্রী (Gender)</label>
            <div className="relative">
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">বেছে নাও</option>
                <option value="Male">পুরুষ (Male)</option>
                <option value="Female">মহিলা (Female)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
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
        </div>
      </div>

      {/* Academic Info */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>একাডেমিক তথ্য</h3>
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
              placeholder="তোমার শিক্ষা প্রতিষ্ঠানের নাম লিখো..."
            />
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>কী নিয়ে চর্চা করতে চাও?</label>
            <div className="relative">
              <select
                name="stream"
                value={formData.stream}
                onChange={handleChange}
                className={selectClass}
              >
                <option>HSC</option>
                <option>SSC</option>
                <option>Admission</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={inputGroupClass}>
              <label className={labelClass}>বিভাগ</label>
              <div className="relative">
                <select
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="Science">Science (বিজ্ঞান)</option>
                  <option value="Business Studies">
                    Business Studies (ব্যবসায় শিক্ষা)
                  </option>
                  <option value="Humanities">Humanities (মানবিক)</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
            <div className={inputGroupClass}>
              <label className={labelClass}>ব্যাচ</label>
              <div className="relative">
                <select
                  name="batch"
                  value={formData.batch}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option>HSC 2024</option>
                  <option>HSC 2025</option>
                  <option>HSC 2026</option>
                  <option>HSC 2027</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>টার্গেট</label>
            <div className="relative">
              <select
                name="target"
                value={formData.target}
                onChange={handleChange}
                className={selectClass}
              >
                <option>Medical</option>
                <option>Engineering</option>
                <option>University</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>এসএসসি রোল নম্বর</label>
            <input
              type="text"
              name="sscRoll"
              value={formData.sscRoll}
              onChange={handleChange}
              className={inputClass}
              placeholder="রোল নম্বর লেখো"
            />
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>এসএসসি রেজিস্ট্রেশন নম্বর</label>
            <input
              type="text"
              name="sscReg"
              value={formData.sscReg}
              onChange={handleChange}
              className={inputClass}
              placeholder="রেজিস্ট্রেশন নম্বর লেখো"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={inputGroupClass}>
              <label className={labelClass}>এসএসসি বোর্ড</label>
              <div className="relative">
                <select
                  name="sscBoard"
                  value={formData.sscBoard}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option>Dhaka</option>
                  <option>Rajshahi</option>
                  <option>Chittagong</option>
                  <option>Jessore</option>
                  <option>Comilla</option>
                  <option>Barisal</option>
                  <option>Sylhet</option>
                  <option>Dinajpur</option>
                  <option>Mymensingh</option>
                  <option>Madrasah</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
            <div className={inputGroupClass}>
              <label className={labelClass}>এসএসসি পাসিং ইয়ার</label>
              <div className="relative">
                <select
                  name="sscYear"
                  value={formData.sscYear}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option>2026</option>
                  <option>2025</option>
                  <option>2024</option>
                  <option>2023</option>
                  <option>2022</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>Optional Subject</label>
            <div className="relative">
              <select
                name="optionalSubject"
                value={formData.optionalSubject}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Select optional subjects...</option>
                <option value="Biology">Biology</option>
                <option value="Statistics">Statistics</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Linking */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>অ্যাকাউন্ট লিংকিং</h3>
        </div>
        <div className={bodyClass}>
          <div className={inputGroupClass}>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                readOnly
                className={`${inputClass} bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-default pr-10`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-emerald-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-xl border-dashed">
            <span className="font-bold text-neutral-700 dark:text-neutral-300 text-sm">
              লিংক অ্যাকাউন্ট
            </span>
            <button
              onClick={handleLinkGoogle}
              disabled={isGoogleLinked || isLinking}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                isGoogleLinked
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 cursor-default'
                  : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              {isLinking ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <Image
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  width={16}
                  height={16}
                  className="w-4 h-4"
                />
              )}

              <span className="text-sm font-medium">
                {isGoogleLinked ? 'Connected' : 'Connect Google'}
              </span>

              {isGoogleLinked && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4 text-emerald-500"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>পাসওয়ার্ড পরিবর্তন</h3>
        </div>
        <div className={bodyClass}>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            পরিবর্তন করতে না চাইলে খালি রাখো
          </p>
          <div className={inputGroupClass}>
            <label className={labelClass}>নতুন পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -tranneutral-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className={inputGroupClass}>
            <label className={labelClass}>পাসওয়ার্ড নিশ্চিত করো</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -tranneutral-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center md:justify-end mt-8">
        <button
          onClick={handleSubmit}
          className="w-full md:w-auto px-10 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
        >
          সব সেভ করো
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
