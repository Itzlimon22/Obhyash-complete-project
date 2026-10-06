import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BlogManagementClient from '@/components/admin/blog/BlogManagementClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Blog Subscribers | Obhyash Admin',
  description:
    'Manage blog newsletter subscribers and export subscriber lists.',
};

export default async function BlogManagementPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // NOTE: If you have an admin role system, verify it here.
  // const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  // if (profile?.role !== 'admin') redirect('/dashboard');

  return (
    <div className="min-h-screen bg-[#f4f5f8] dark:bg-[#0d0d0f] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ব্লগ ও নিউজলেটার সাবস্ক্রাইবার
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 font-medium">
              ব্লগের সমস্ত নিউজলেটার সাবস্ক্রাইবারদের তালিকা পরিচালনা ও CSV এক্সপোর্ট করুন।
            </p>
          </div>
        </div>

        {/* Client Dashboard */}
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          }
        >
          <BlogManagementClient />
        </Suspense>
      </div>
    </div>
  );
}
