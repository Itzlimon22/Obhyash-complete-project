import { useState } from 'react';
import Image from 'next/image';
import { Camera, Trash2, Loader2, Lock, HelpCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';
import UserAvatar from '../../common/UserAvatar';
import { useAuth } from '@/components/auth/AuthProvider';
import { uploadAvatar } from '@/services/storage-service';
import { getErrorMessage } from '@/lib/error-utils';
import { searchColleges } from '@/lib/college-mapping';

interface PersonalDetailsPanelProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => Promise<void> | void;
}

const FieldTooltip = ({ text }: { text: string }) => (
  <span className="relative group inline-flex items-center ml-1 cursor-pointer">
    <HelpCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors" />
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-60 p-2.5 bg-neutral-900 dark:bg-neutral-800 text-white text-[11.5px] font-medium leading-relaxed rounded-xl shadow-xl text-center border border-neutral-700 font-bengali">
      {text}
    </span>
  </span>
);

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
  'bg-white dark:bg-neutral-950 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden';
const headerClass =
  'px-6 py-4 border-b border-green-900 bg-green-800 flex items-center justify-between';
const headerTitleClass = 'text-lg font-bold text-white';
const bodyClass = 'p-6 space-y-6';
const inputGroupClass = 'space-y-2';
const labelClass =
  'block text-sm font-medium text-neutral-600 dark:text-neutral-400';
const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition-all text-neutral-800 dark:text-neutral-200';
const selectClass =
  'w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-green-700/20 focus:border-green-700 transition-all text-neutral-800 dark:text-neutral-200 appearance-none';

const ChevronDownIcon = () => (
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
    />
  </svg>
);

export default function PersonalDetailsPanel({
  user,
  onSave,
}: PersonalDetailsPanelProps) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [showPassword, setShowPassword] = useState(false);
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);



  const [formData, setFormData] = useState({
    name: user.name || '',
    dob: user.dob || '',
    gender: user.gender || '',
    address: user.address || '',
    institute: user.institute || '',
    stream: user.stream || 'HSC',
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
      toast.success('সফলভাবে প্রোফাইল ছবি পরিবর্তন করা হয়েছে!', {
        position: 'top-center',
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('নাম লেখা আবশ্যক!');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      toast.error('সঠিক ইমেইল ঠিকানা দাও!');
      return false;
    }
    const phoneRegex = /^01\d{9}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      toast.error('সঠিক 11 ডিজিটের ফোন নম্বর দাও');
      return false;
    }
    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না!', { position: 'top-center' });
      return false;
    }
    return true;
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSaving(true);

    const payload: SettingsUpdatePayload = {
      name: formData.name,
      dob: formData.dob || null,
      gender: formData.gender || null,
      address: formData.address || null,
      institute: formData.institute,
      stream: formData.stream,
      division: formData.group,
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

    try {
      const supabase = createClient();

      // 1. Password change (independent — runs regardless of onSave)
      if (formData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword,
        });
        if (passwordError) throw passwordError;
        toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!', {
          position: 'top-center',
        });
      }

      // 2. Profile save — prefer the onSave callback (goes through StudentRoot → updateUserProfile)
      if (onSave) {
        // onSave is async in StudentRoot — await it so errors surface here
        await onSave({
          ...payload,
          phone: payload.phone ?? undefined,
          dob: payload.dob ?? undefined,
          gender: payload.gender ?? undefined,
          address: payload.address ?? undefined,
          avatarUrl: payload.avatar_url ?? undefined,
        });
      } else {
        // Fallback: direct DB write (used when panel is rendered standalone)
        const { error } = await supabase
          .from('users')
          .update(payload)
          .eq('id', user.id);
        if (error) throw error;
      }

      toast.success('সেটিংস সফলভাবে সেভ করা হয়েছে!', {
        position: 'top-center',
      });

      setFormData((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };


  const eyeIcon = (
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
  );
  const eyeOffIcon = (
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
  );

  return (
    <div className="space-y-4 animate-fade-in pb-4">
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
              className="flex items-center gap-2 text-sm font-bold text-green-100 hover:text-white cursor-pointer"
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
                user={{ ...user, avatarUrl }}
                size="2xl"
                showBorder
                className="transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <label
                htmlFor="avatar-upload"
                className={`absolute inset-0 bg-black/40 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}
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
                  toast.success('ছবি সরিয়ে নেওয়া হয়েছে।');
                }}
                className="mt-4 flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> ছবি সরিয়ে ফেলো
              </button>
            )}
            <p className="mt-3 text-[10px] text-neutral-400 dark:text-neutral-500 max-w-[200px] text-center">
              JPG, PNG বা WEBP (সর্বোচ্চ ২ মেগাবাইট)
            </p>
          </div>

          {/* Student ID (Read Only) */}
          <div className={inputGroupClass}>
            <label className={labelClass}>স্টুডেন্ট আইডি</label>
            <input
              type="text"
              value={user.student_id || `OBH-${user.id.slice(0, 5).toUpperCase()}`}
              readOnly
              disabled
              className={`${inputClass} bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 font-mono cursor-not-allowed`}
            />
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
            <label className={labelClass}>ফোন নম্বর</label>
            <div className="relative">
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`${inputClass} ${user.phone ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed' : ''}`}
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
                <ChevronDownIcon />
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
            <div className="relative">
              <input
                type="text"
                name="institute"
                value={formData.institute}
                onChange={(e) => {
                  handleChange(e);
                  setShowCollegeSuggestions(true);
                }}
                onBlur={() =>
                  setTimeout(() => setShowCollegeSuggestions(false), 150)
                }
                className={inputClass}
                placeholder="তোমার শিক্ষা প্রতিষ্ঠানের নাম লিখো..."
                autoComplete="off"
              />
              {showCollegeSuggestions &&
                formData.institute.length > 0 &&
                searchColleges(formData.institute).length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg overflow-hidden">
                    {searchColleges(formData.institute).map((name) => (
                      <li
                        key={name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, institute: name }));
                          setShowCollegeSuggestions(false);
                        }}
                        className="px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer font-bengali"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>কী নিয়ে চর্চা করতে চাও?</label>
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
                <ChevronDownIcon />
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
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            {/* Batch with 1-time change rule & Tooltip */}
            {(() => {
              const isBatchLocked = !!user.batch && (user.batch_change_count ?? 0) >= 1;
              return (
                <div className={inputGroupClass}>
                  <label className={labelClass}>
                    ব্যাচ
                    <FieldTooltip
                      text={
                        isBatchLocked
                          ? 'তুমি ইতিমধ্যে ১ বার ব্যাচ পরিবর্তন করেছো। তাই এটি আর পরিবর্তন করা যাবে না।'
                          : 'ব্যাচ সর্বোচ্চ ১ বার পরিবর্তন করার সুযোগ পাবে।'
                      }
                    />
                  </label>
                  <div className="relative">
                    <select
                      name="batch"
                      value={formData.batch}
                      onChange={handleChange}
                      disabled={isBatchLocked}
                      className={`${selectClass} ${isBatchLocked ? 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-500 cursor-not-allowed' : ''}`}
                    >
                      <option>HSC 2024</option>
                      <option>HSC 2025</option>
                      <option>HSC 2026</option>
                      <option>HSC 2027</option>
                      <option>SSC 2025</option>
                      <option>SSC 2026</option>
                      <option>SSC 2027</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                      <ChevronDownIcon />
                    </div>
                  </div>
                </div>
              );
            })()}
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
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* SSC Info — Always Editable */}
          <div className="pt-2 pb-1">
            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300 font-bengali">
              এসএসসি পরীক্ষার তথ্য
            </span>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>এসএসসি রোল নম্বর</label>
            <div className="relative">
              <input
                type="text"
                name="sscRoll"
                value={formData.sscRoll}
                onChange={handleChange}
                className={inputClass}
                placeholder="রোল নম্বর লেখো"
              />
            </div>
          </div>

          <div className={inputGroupClass}>
            <label className={labelClass}>এসএসসি রেজিস্ট্রেশন নম্বর</label>
            <div className="relative">
              <input
                type="text"
                name="sscReg"
                value={formData.sscReg}
                onChange={handleChange}
                className={inputClass}
                placeholder="রেজিস্ট্রেশন নম্বর লেখো"
              />
            </div>
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
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
            <div className={inputGroupClass}>
              <label className={labelClass}>এসএসসি পাসিং ইয়ার</label>
              <div className="relative">
                <select
                  name="sscYear"
                  value={formData.sscYear}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option>2027</option>
                  <option>2026</option>
                  <option>2025</option>
                  <option>2024</option>
                  <option>2023</option>
                  <option>2022</option>
                  <option>2021</option>
                  <option>2020</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                  <ChevronDownIcon />
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
                <ChevronDownIcon />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password */}
      <div className={cardClass}>
        <div className={headerClass}>
          <h3 className={headerTitleClass}>পাসওয়ার্ড পরিবর্তন</h3>
        </div>
        <div className={bodyClass}>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            পরিবর্তন করতে না চাইলে খালি রাখো
          </p>
          <div className={inputGroupClass}>
            <label className={labelClass}>নতুন পাসওয়ার্ড</label>
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showPassword ? eyeOffIcon : eyeIcon}
              </button>
            </div>
          </div>
          <div className={inputGroupClass}>
            <label className={labelClass}>পাসওয়ার্ড নিশ্চিত করো</label>
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                {showPassword ? eyeOffIcon : eyeIcon}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-center md:justify-end mt-4">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full md:w-auto px-10 py-3.5 bg-green-800 hover:bg-green-900 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSaving ? 'সেভ হচ্ছে...' : 'সব সেভ করো'}
        </button>
      </div>
    </div>
  );
}
