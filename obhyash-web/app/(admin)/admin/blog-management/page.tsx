import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BlogManagementClient from '@/components/admin/blog/BlogManagementClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Blog Management | Obhyash Admin',
  description:
    'Manage blog comments, subscribers, and view interaction metrics.',
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
    <div className="min-h-screen bg-slate-50/50 dark:bg-black p-4 sm:p-6 lg:p-10 font-anek">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              ব্লগ ম্যাওেজমেন্ট
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              ব্লগের সমস্ত কমেন্ট মডারেট করো এবং নিউজলেটার সাবস্ক্রাইবারদের
              পরিচালনা করো।
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
