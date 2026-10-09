import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BlogManagementClient from '@/components/admin/blog/BlogManagementClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Conversion Monitor Hub | Obhyash Admin',
  description:
    'Real-time conversion tracking for App Downloads, Signups, SSC/HSC Demo Exams, and Button Analytics.',
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
