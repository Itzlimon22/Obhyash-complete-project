'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Trash2,
  Loader2,
  Lock,
  HelpCircle,
  Calendar,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';
import UserAvatar from '../../common/UserAvatar';
import { searchColleges } from '@/lib/college-mapping';
import AvatarPickerModal from '../dashboard/AvatarPickerModal';

interface PersonalDetailsPanelProps {
  user: UserProfile;
  onSave?: (data: Partial<UserProfile>) => Promise<void> | void;
}

const FieldTooltip = ({ text }: { text: string }) => (
  <span className="relative group inline-flex items-center ml-1 cursor-pointer">
    <HelpCircle className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] hover:text-emerald-700 transition-colors" />
    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50 w-60 p-2.5 bg-neutral-900 dark:bg-neutral-800 text-white text-[11.5px] font-medium leading-relaxed rounded-xl shadow-xl text-center border border-neutral-700 font-['HindSiliguri',sans-serif]">
      {text}
    </span>
  </span>
);

export default function PersonalDetailsPanel({
  user,
  onSave,
}: PersonalDetailsPanelProps) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  const [collegeSuggestions, setCollegeSuggestions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
    phone: user.phone || '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInstituteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, institute: val }));
    const suggestions = searchColleges(val);
    setCollegeSuggestions(suggestions);
    setShowCollegeSuggestions(val.trim().length > 0 && suggestions.length > 0);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('নাম লেখা আবশ্যক!');
      return false;
    }
    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না!');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);

    const rawT = formData.target.trim();
    let computedExamTarget = 'hsc_2026';
    if (rawT.toLowerCase().includes('med')) computedExamTarget = 'mbbs_2026';
    else if (rawT.toLowerCase().includes('eng')) computedExamTarget = 'eng_2026';
    else if (rawT.toLowerCase().includes('univ') || rawT.toLowerCase().includes('varsity')) computedExamTarget = 'varsity_2026';

    const updates: Record<string, any> = {
      name: formData.name.trim(),
      dob: formData.dob.trim() ? formData.dob.trim() : null,
      gender: formData.gender.trim() ? formData.gender.trim() : null,
      address: formData.address.trim() ? formData.address.trim() : null,
      institute: formData.institute.trim(),
      stream: formData.stream.trim() ? formData.stream.trim() : null,
      division: formData.group.trim() ? formData.group.trim() : null,
      batch: formData.batch.trim() ? formData.batch.trim() : null,
      target: rawT || null,
      exam_target: computedExamTarget,
      optional_subject: formData.optionalSubject.trim()
        ? formData.optionalSubject.trim()
        : null,
      avatar_url: avatarUrl || null,
    };

    if (formData.sscRoll.trim()) updates.ssc_roll = formData.sscRoll.trim();
    if (formData.sscReg.trim()) updates.ssc_reg = formData.sscReg.trim();
    if (formData.sscBoard.trim()) updates.ssc_board = formData.sscBoard.trim();
    if (formData.sscYear.trim())
      updates.ssc_passing_year = formData.sscYear.trim();

    try {
      const supabase = createClient();

      // Password update
      if (formData.newPassword.trim()) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.newPassword.trim(),
        });
        if (passwordError) throw passwordError;
        toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!');
      }

      // Profile updates
      if (onSave) {
        await onSave({
          ...updates,
          phone: formData.phone || undefined,
          dob: updates.dob || undefined,
          gender: updates.gender || undefined,
          address: updates.address || undefined,
          avatarUrl: avatarUrl || undefined,
        });
      } else {
        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', user.id);
        if (error) throw error;
      }

      toast.success('প্রোফাইল তথ্য সফলভাবে সেভ করা হয়েছে!');
      setFormData((prev) => ({
        ...prev,
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error('তথ্য আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করো।');
    } finally {
      setIsSaving(false);
    }
  };

  const isBatchLocked =
    !!user.batch && (user.batch_change_count ?? 0) >= 1;

  const cardContainerClass =
    'bg-white dark:bg-[#18181B] rounded-[16px] border border-[#F5F5F5] dark:border-[#1C1C1E] shadow-2xs overflow-hidden mb-6';
  const sectionHeaderClass =
    'px-5 py-4 border-b border-[#F5F5F5] dark:border-[#1C1C1E] text-[17px] font-bold text-[#111827] dark:text-white font-["HindSiliguri",sans-serif]';
  const labelClass =
    'block text-[13px] font-semibold text-[#4B5563] dark:text-[#A3A3A3] mb-1.5 font-["HindSiliguri",sans-serif]';
  const inputClass =
    'w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5E5] dark:border-[#1C1C1E] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#10B981] transition-colors font-["HindSiliguri",sans-serif]';
  const selectClass =
    'w-full px-3.5 py-2.5 rounded-[12px] border border-[#E5E5E5] dark:border-[#1C1C1E] bg-[#FAFAFA] dark:bg-[#0A0A0A] text-sm text-neutral-900 dark:text-white focus:outline-none focus:border-[#10B981] transition-colors font-["HindSiliguri",sans-serif] cursor-pointer';

  return (
    <div className="w-full max-w-2xl mx-auto font-['HindSiliguri',sans-serif] pb-16">
      {/* ── 0. Avatar Card (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <div className="p-5 flex items-center gap-4">
          <div
            onClick={() => setShowAvatarPicker(true)}
            className="cursor-pointer shrink-0 transition-transform active:scale-95"
          >
            <UserAvatar
              user={{ ...user, avatarUrl }}
              size="2xl"
              showBorder
              className="border-2.5 border-[#059669] shadow-xs"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-[17px] font-extrabold text-[#111827] dark:text-white">
              প্রোফাইল ছবি
            </h3>
            <p className="text-[13px] text-[#6B7280] dark:text-[#A3A3A3] mt-0.5 leading-snug">
              ছবি আপলোড করো বা কার্টুন ছবি বেছে নাও
            </p>
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="mt-2.5 px-3.5 py-1.5 rounded-[10px] border border-[#059669] text-[#059669] text-[13px] font-bold flex items-center gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>ছবি পরিবর্তন করো</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. Personal Info Card (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <div className={sectionHeaderClass}>ব্যক্তিগত তথ্য</div>
        <div className="p-5 sm:p-6 space-y-4">
          {/* Student ID (Permanent Read-Only) */}
          <div>
            <label className={labelClass}>স্টুডেন্ট আইডি</label>
            <input
              type="text"
              value={user.student_id || `OBH-${user.id.slice(0, 5).toUpperCase()}`}
              readOnly
              disabled
              className={`${inputClass} bg-[#F5F5F5] dark:bg-[#1C1C1E] text-[#A3A3A3] dark:text-[#737373] font-mono cursor-not-allowed`}
            />
          </div>

          {/* Name */}
          <div>
            <label className={labelClass}>নাম</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="তোমার পুরো নাম লেখো"
              className={inputClass}
            />
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>ফোন নম্বর</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              readOnly={!!user.phone}
              disabled={!!user.phone}
              placeholder="০১৭১XXXXXXXX"
              className={`${inputClass} ${user.phone ? 'bg-[#F5F5F5] dark:bg-[#1C1C1E] text-[#A3A3A3] cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className={labelClass}>জন্ম তারিখ</label>
            <div className="relative">
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className={labelClass}>ছাত্র/ছাত্রী (Gender)</label>
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
          </div>

          {/* Address */}
          <div>
            <label className={labelClass}>ঠিকানা</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="বর্তমান ঠিকানা..."
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── 2. Academic Info Card (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <div className={sectionHeaderClass}>একাডেমিক তথ্য</div>
        <div className="p-5 sm:p-6 space-y-4">
          {/* Institute with Suggestions */}
          <div className="relative">
            <label className={labelClass}>শিক্ষা প্রতিষ্ঠানের নাম</label>
            <input
              type="text"
              name="institute"
              value={formData.institute}
              onChange={handleInstituteChange}
              onFocus={() => {
                if (formData.institute.trim().length > 0) {
                  const suggestions = searchColleges(formData.institute);
                  setCollegeSuggestions(suggestions);
                  setShowCollegeSuggestions(suggestions.length > 0);
                }
              }}
              placeholder="তোমার শিক্ষা প্রতিষ্ঠানের নাম লিখো..."
              autoComplete="off"
              className={inputClass}
            />
            {showCollegeSuggestions && (
              <div className="absolute z-30 w-full mt-1 bg-white dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2D2D2D] rounded-[12px] shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                {collegeSuggestions.map((name) => (
                  <div
                    key={name}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, institute: name }));
                      setShowCollegeSuggestions(false);
                    }}
                    className="px-4 py-2.5 text-sm text-[#1F2937] dark:text-[#E5E5E5] hover:bg-emerald-50 dark:hover:bg-emerald-950/20 cursor-pointer"
                  >
                    {name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stream */}
          <div>
            <label className={labelClass}>কী নিয়ে চর্চা করতে চাও?</label>
            <select
              name="stream"
              value={formData.stream}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="HSC">HSC</option>
              <option value="SSC">SSC</option>
              <option value="Admission">Admission</option>
            </select>
          </div>

          {/* Division & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>বিভাগ</label>
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
            </div>

            <div>
              <label className={labelClass}>
                <span>ব্যাচ</span>
                <FieldTooltip
                  text={
                    isBatchLocked
                      ? 'তুমি ইতিমধ্যে ১ বার ব্যাচ পরিবর্তন করেছো। তাই এটি আর পরিবর্তন করা যাবে না।'
                      : 'ব্যাচ সর্বোচ্চ ১ বার পরিবর্তন করার সুযোগ পাবে।'
                  }
                />
              </label>
              <select
                name="batch"
                value={formData.batch}
                onChange={handleChange}
                disabled={isBatchLocked}
                className={`${selectClass} ${isBatchLocked ? 'bg-[#F5F5F5] dark:bg-[#1C1C1E] text-[#A3A3A3] cursor-not-allowed' : ''}`}
              >
                <option value="HSC 2024">HSC 2024</option>
                <option value="HSC 2025">HSC 2025</option>
                <option value="HSC 2026">HSC 2026</option>
                <option value="HSC 2027">HSC 2027</option>
                <option value="SSC 2025">SSC 2025</option>
                <option value="SSC 2026">SSC 2026</option>
                <option value="SSC 2027">SSC 2027</option>
              </select>
            </div>
          </div>

          {/* Target */}
          <div>
            <label className={labelClass}>টার্গেট</label>
            <select
              name="target"
              value={formData.target}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="Medical">Medical</option>
              <option value="Engineering">Engineering</option>
              <option value="University">University</option>
            </select>
          </div>

          {/* SSC Info Header */}
          <div className="pt-2 pb-1 border-t border-neutral-100 dark:border-neutral-800">
            <h4 className="text-sm font-bold text-[#374151] dark:text-[#E5E5E5]">
              এসএসসি পরীক্ষার তথ্য
            </h4>
          </div>

          {/* SSC Roll */}
          <div>
            <label className={labelClass}>এসএসসি রোল নম্বর</label>
            <input
              type="text"
              name="sscRoll"
              value={formData.sscRoll}
              onChange={handleChange}
              placeholder="রোল নম্বর লেখো"
              className={inputClass}
            />
          </div>

          {/* SSC Reg */}
          <div>
            <label className={labelClass}>এসএসসি রেজিস্ট্রেশন নম্বর</label>
            <input
              type="text"
              name="sscReg"
              value={formData.sscReg}
              onChange={handleChange}
              placeholder="রেজিস্ট্রেশন নম্বর লেখো"
              className={inputClass}
            />
          </div>

          {/* SSC Board & Passing Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>এসএসসি বোর্ড</label>
              <select
                name="sscBoard"
                value={formData.sscBoard}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="Dhaka">Dhaka</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Jessore">Jessore</option>
                <option value="Comilla">Comilla</option>
                <option value="Barisal">Barisal</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Dinajpur">Dinajpur</option>
                <option value="Mymensingh">Mymensingh</option>
                <option value="Madrasah">Madrasah</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>এসএসসি পাসিং ইয়ার</label>
              <select
                name="sscYear"
                value={formData.sscYear}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
            </div>
          </div>

          {/* Optional Subject */}
          <div>
            <label className={labelClass}>Optional Subject</label>
            <select
              name="optionalSubject"
              value={formData.optionalSubject}
              onChange={handleChange}
              className={selectClass}
            >
              <option value="">Select optional subject...</option>
              <option value="Biology">Biology</option>
              <option value="Statistics">Statistics</option>
              <option value="Higher Math">Higher Math</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 3. Password Change Card (1:1 with Flutter) ── */}
      <div className={cardContainerClass}>
        <div className={sectionHeaderClass}>পাসওয়ার্ড পরিবর্তন</div>
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-[13px] text-[#737373] dark:text-[#A3A3A3]">
            পরিবর্তন করতে না চাইলে খালি রাখো
          </p>

          {/* New Password */}
          <div>
            <label className={labelClass}>নতুন পাসওয়ার্ড</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="নতুন পাসওয়ার্ড দিন"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className={labelClass}>পাসওয়ার্ড নিশ্চিত করো</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="পুনরায় পাসওয়ার্ড দিন"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Save Button (1:1 with Flutter) ── */}
      <div>
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={isSaving}
          className="w-full py-3.5 px-6 rounded-[12px] bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-base shadow-sm shadow-[#059669]/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>সংরক্ষণ হচ্ছে...</span>
            </>
          ) : (
            <span>পরিবর্তন সংরক্ষণ করো</span>
          )}
        </button>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <AvatarPickerModal
          user={user}
          onClose={() => setShowAvatarPicker(false)}
          onAvatarUpdated={(newUrl) => {
            setAvatarUrl(newUrl);
            if (onSave) onSave({ avatarUrl: newUrl });
          }}
        />
      )}
    </div>
  );
}
