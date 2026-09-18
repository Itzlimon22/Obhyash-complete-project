import { createClient } from '@/utils/supabase/server';
import DashboardClient from '../dashboard/DashboardClient';
import PolicyPageShell from '@/components/legal/PolicyPageShell';
import { LEGAL_CONTENT } from '@/lib/constants/legal-content';
import { UserProfile } from '@/lib/types';
import Link from 'next/link';
import { Trash2, Mail, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Request Account & Data Deletion | Obhyash',
  description:
    'Information and instructions on how to request permanent deletion of your Obhyash student account and associated personal data.',
};

export default async function DeleteAccountRoutePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, show their in-app deletion tab directly
  if (user) {
    const [{ data: dbProfile }, { data: subjectsData }] = await Promise.all([
      supabase.from('users').select('*').eq('id', user.id).single(),
      supabase.from('subjects').select('*'),
    ]);

    const userProfile: UserProfile = dbProfile
      ? {
          ...dbProfile,
          streakCount: dbProfile.streak || dbProfile.streak_count || 0,
          lastStreakDate: dbProfile.last_streak_date,
          examsTaken: dbProfile.exams_taken || 0,
          enrolledExams: dbProfile.enrolled_exams || 0,
          avatarUrl: dbProfile.avatar_url,
          avatarColor: dbProfile.avatar_color,
          createdAt: dbProfile.created_at,
          role: dbProfile.role || 'Student',
          status: dbProfile.status || 'Active',
          xp: dbProfile.xp || 0,
          level: dbProfile.level || 'Beginner',
          subscription: dbProfile.subscription || { plan: 'Free', status: 'Active' },
        }
      : ({} as any);

    return (
      <DashboardClient
        user={userProfile}
        subjects={subjectsData || []}
        initialTab="delete-account"
      />
    );
  }

  // Public view: Google Play Compliant Account Deletion Request Page
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* Brand Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold tracking-tight text-white">
              অভ্যাস <span className="text-teal-400 text-lg font-normal">/ Obhyash</span>
            </span>
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <Trash2 className="w-3.5 h-3.5" />
            User Data & Account Erasure
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Request Account & Data Deletion
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            In compliance with Google Play Store policies and our Privacy Policy, Obhyash provides full rights for users to request permanent removal of their account and personal records.
          </p>
        </div>

        {/* Action Cards */}
        <div className="space-y-6">
          {/* Method 1: Email Request (Direct for unauthenticated / uninstalled users) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                <Mail className="w-6 h-6 text-teal-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Method 1: Email Request (Quickest)</h2>
                <p className="text-sm text-slate-400 mt-1">
                  You do not need to install the app or log in. Simply email our dedicated data protection desk from your registered email address.
                </p>
                <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 font-mono space-y-1">
                  <div><span className="text-slate-500">To:</span> support@obhyash.com</div>
                  <div><span className="text-slate-500">Subject:</span> Request Account Deletion</div>
                  <div><span className="text-slate-500">Body:</span> Please permanently delete my Obhyash account associated with this email address.</div>
                </div>
                <div className="mt-4">
                  <a
                    href="mailto:support@obhyash.com?subject=Request%20Account%20Deletion&body=Please%20permanently%20delete%20my%20Obhyash%20account%20associated%20with%20this%20email%20address."
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm transition-colors shadow-lg shadow-teal-500/20"
                  >
                    Send Deletion Email
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Method 2: In-App / In-Portal Deletion */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-rose-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white">Method 2: In-App Instant Deletion</h2>
                <p className="text-sm text-slate-400 mt-1">
                  If you have active access to your account on the app or website:
                </p>
                <ol className="mt-3 space-y-2 text-xs sm:text-sm text-slate-300 list-decimal list-inside">
                  <li>Open the Obhyash mobile app or website and log in.</li>
                  <li>Navigate to <strong>Profile &gt; Settings &gt; Delete Account</strong>.</li>
                  <li>Confirm your password/action to immediately delete your account.</li>
                </ol>
                <div className="mt-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
                  >
                    Log in to delete in-app
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Deletion Scope & Policy Details */}
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
              What happens when your account is deleted?
            </h3>
            <ul className="text-xs text-slate-400 space-y-2">
              <li>• <strong>Personal Records:</strong> Your name, email, phone number, and avatar are permanently removed.</li>
              <li>• <strong>Academic Data:</strong> All exam histories, scorecards, bookmarks, and streak records are purged.</li>
              <li>• <strong>Timeline:</strong> Primary database records are deleted immediately or within 30 days of email verification.</li>
              <li>• <strong>Retention:</strong> Financial transaction records may be retained as required by tax and anti-fraud regulations.</li>
            </ul>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center mt-8 text-xs text-slate-500">
          For further details, view our full{' '}
          <Link href="/privacy" className="text-teal-400 underline hover:text-teal-300">
            Privacy Policy
          </Link>
          .
        </div>
      </div>
    </div>
  );
}

