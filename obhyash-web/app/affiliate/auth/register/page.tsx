'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react';

export default function AffiliateAuthRegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    age: '',
    education: '',
    payoutNumber: '',
    password: '',
    confirmPassword: '',
    promotionPlan: '',
    promotionChannels: '',
    socialLinks: '',
    hasExperience: 'no', // 'yes' | 'no'
    motivation: '',
    agreedTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleRadioChange = (val: string) => {
    setFormData((prev) => ({ ...prev, hasExperience: val }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, agreedTerms: e.target.checked }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validations
    if (!formData.fullName.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।');
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMessage('অনুগ্রহ করে আপনার সক্রিয় হোয়াটসঅ্যাপ নম্বর দিন।');
      return;
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, '');
    if (!cleanPhone.match(/^(?:\+88|88)?01[3-9]\d{8}$/)) {
      setErrorMessage('অনুগ্রহ করে একটি সঠিক বাংলাদেশী মোবাইল নম্বর (যেমন: 017XXXXXXXX) দিন।');
      return;
    }

    if (!formData.payoutNumber.trim()) {
      setErrorMessage('অনুগ্রহ করে পেমেন্ট গ্রহণের জন্য আপনার বিকাশ নম্বর দিন।');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMessage('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না!');
      return;
    }

    if (!formData.agreedTerms) {
      setErrorMessage('আবেদন সম্পন্ন করতে অনুগ্রহ করে শর্তাবলী ও নীতিমালায় সম্মতি দিন।');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          phone: cleanPhone,
          age: formData.age,
          education: formData.education,
          payoutNumber: formData.payoutNumber,
          paymentMethod: 'bKash',
          password: formData.password || null,
          promotionPlan: formData.promotionPlan,
          promotionChannels: formData.promotionChannels,
          socialLinks: formData.socialLinks,
          hasExperience: formData.hasExperience === 'yes',
          motivation: formData.motivation,
          agreedTerms: formData.agreedTerms,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'আবেদন জমা দিতে সমস্যা হয়েছে।');
      }

      setSubmitted(true);
      setReferenceId(data.id || '');
    } catch (err: any) {
      setErrorMessage(err.message || 'নেটওয়ার্ক বা সার্ভার সমস্যা। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090a0b] text-[#e0e2e5] font-sans antialiased py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Top Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/affiliate" className="inline-block transition-transform hover:scale-105">
            <Image
              src="/obhyash_full_logo_dark.svg"
              alt="অভ্যাস"
              width={160}
              height={55}
              priority
              className="h-12 w-auto object-contain"
            />
          </Link>
        </div>

        {submitted ? (
          /* Success Screen */
          <div className="bg-[#121316] border border-[#23262a] rounded-2xl p-6 sm:p-8 text-center shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">
              আবেদন সফলভাবে গৃহীত হয়েছে!
            </h2>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6">
              অভ্যাস অ্যাফিলিয়েট প্রোগ্রামে যুক্ত হতে আবেদনের জন্য ধন্যবাদ। আমাদের পার্টনার ম্যানেজমেন্ট টিম আপনার তথ্যগুলো যাচাই করে দ্রুতই আপনার হোয়াটসঅ্যাপ নম্বরে যোগাযোগ করবে।
            </p>

            {referenceId && (
              <div className="bg-[#1a1c20] border border-[#2c3036] rounded-lg p-3 text-xs text-gray-400 mb-6 font-mono">
                আবেদন রেফারেন্স আইডি: <span className="text-emerald-400 select-all">{referenceId}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/affiliate"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[#1f2227] hover:bg-[#282c33] text-gray-200 text-sm font-medium transition-colors"
              >
                প্রোগ্রামের বিস্তারিত দেখুন
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
              >
                হোমপেজে ফিরে যান
              </Link>
            </div>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error banner */}
            {errorMessage && (
              <div className="flex items-start gap-3 p-4 bg-red-950/40 border border-red-500/40 rounded-xl text-red-300 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Field 1: Full Name */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                আপনার পূর্ণ নাম লিখুন <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="যেমন: সাকিব আহমেদ"
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Field 2: Mobile Number (WhatsApp) */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                আপনার মোবাইল নম্বর দিন (Active whatsapp number) <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Field 3: Age */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                আপনার বয়স কত?
              </label>
              <input
                type="text"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="যেমন: ২১"
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Field 4: Educational Qualification */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                আপনার শিক্ষাগত যোগ্যতা?
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="যেমন: HSC 26 / অনার্স ১ম বর্ষ / ঢাকা বিশ্ববিদ্যালয়"
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Field 5: Bkash Number */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                Bkash Number (পেমেন্ট গ্রহণের জন্য) <span className="text-red-400">*</span>
              </label>
              <input
                type="tel"
                name="payoutNumber"
                required
                value={formData.payoutNumber}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            {/* Field 6: Password */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                  className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Field 7: Confirm Password */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="পাসওয়ার্ড পুনরায় নিশ্চিত করুন"
                  className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 pr-11 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Field 8: Promotion Plan */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2 leading-relaxed">
                আপনি অভ্যাসের কুপন/লিংক কোথায় এবং কীভাবে প্রচার করবেন—বিস্তারিত লিখুন
              </label>
              <textarea
                name="promotionPlan"
                rows={4}
                value={formData.promotionPlan}
                onChange={handleChange}
                placeholder="আপনার প্রচার পরিকল্পনা, কোন বন্ধুদের বা গ্রুপে শেয়ার করবেন তা সংক্ষেপে লিখুন..."
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-y min-h-[100px]"
              />
            </div>

            {/* Field 9: Promotion Channels */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2 leading-relaxed">
                আপনার কুপন/লিংক প্রচারের জন্য কী কী চ্যানেল আছে (Facebook গ্রুপ, Telegram গ্রুপ, YouTube চ্যানেল, Website ইত্যাদি) — বিস্তারিত লিখুন, লিংক সহ।
              </label>
              <textarea
                name="promotionChannels"
                rows={4}
                value={formData.promotionChannels}
                onChange={handleChange}
                placeholder="আপনার গ্রুপ বা পেজের নাম, সদস্য সংখ্যা এবং লিংক সহ বিস্তারিত লিখুন..."
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-y min-h-[100px]"
              />
            </div>

            {/* Field 10: Social Media Links */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                আপনার নিজের সকল সোশ্যাল মিডিয়া লিঙ্ক
              </label>
              <textarea
                name="socialLinks"
                rows={3}
                value={formData.socialLinks}
                onChange={handleChange}
                placeholder="আপনার ফেসবুক প্রোফাইল, ইনস্টাগ্রাম বা লিঙ্কডইন লিংক..."
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-y min-h-[80px]"
              />
            </div>

            {/* Field 11: Prior Experience Radio */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-3">
                আপনার কি অ্যাফিলিয়েট মার্কেটিংয়ের পূর্ব অভিজ্ঞতা আছে?
              </label>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2.5 cursor-pointer text-gray-200 text-sm sm:text-base">
                  <input
                    type="radio"
                    name="hasExperience"
                    checked={formData.hasExperience === 'yes'}
                    onChange={() => handleRadioChange('yes')}
                    className="w-4 h-4 text-emerald-600 bg-gray-900 border-gray-600 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span>হ্যাঁ</span>
                </label>

                <label className="inline-flex items-center gap-2.5 cursor-pointer text-gray-200 text-sm sm:text-base">
                  <input
                    type="radio"
                    name="hasExperience"
                    checked={formData.hasExperience === 'no'}
                    onChange={() => handleRadioChange('no')}
                    className="w-4 h-4 text-emerald-600 bg-gray-900 border-gray-600 focus:ring-emerald-500 focus:ring-offset-0"
                  />
                  <span>না</span>
                </label>
              </div>
            </div>

            {/* Field 12: Motivation */}
            <div>
              <label className="block text-sm sm:text-base font-medium text-gray-200 mb-2">
                আপনি আমাদের অ্যাফিলিয়েশন প্রোগ্রামে কেন যোগ দিতে চান?
              </label>
              <textarea
                name="motivation"
                rows={4}
                value={formData.motivation}
                onChange={handleChange}
                placeholder="আপনার আগ্রহের কারণ বা লক্ষ্য সংক্ষেপে লিখুন..."
                className="w-full bg-[#141518] border border-[#26282d] rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm sm:text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition resize-y min-h-[100px]"
              />
            </div>

            {/* Field 13: Terms Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreedTerms"
                  checked={formData.agreedTerms}
                  onChange={handleCheckboxChange}
                  className="mt-1 w-4 h-4 rounded text-emerald-600 bg-gray-900 border-gray-600 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <span className="text-sm text-gray-300 select-none">
                  আপনি আমাদের শর্তাবলী ও নীতিমালা মেনে চলবেন কি?{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Policies and Rules
                  </Link>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#056f42] hover:bg-[#06844f] active:bg-[#045c37] text-white font-medium text-base py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>জমা হচ্ছে...</span>
                  </>
                ) : (
                  <span>Submit</span>
                )}
              </button>
            </div>

            {/* Or Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1e2024]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#121316] border border-[#23262a] px-4 py-1 text-gray-400 rounded">
                  Or
                </span>
              </div>
            </div>

            {/* Login Button */}
            <div>
              <Link
                href="/login"
                className="inline-block border border-[#00a86b] text-[#00e699] hover:bg-[#00a86b]/10 rounded-md py-2.5 px-6 text-sm font-medium transition-colors"
              >
                লগইন করো
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
