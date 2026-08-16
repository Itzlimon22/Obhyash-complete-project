'use client';

import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Wrench, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [message, setMessage] = useState('');
  const { profile } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function checkMaintenance() {
      try {
        const { data } = await supabase
          .from('app_config')
          .select('maintenance_mode, maintenance_message')
          .eq('id', 'global_config')
          .maybeSingle();

        if (data && isMounted) {
          setMaintenanceMode(data.maintenance_mode || false);
          setMessage(
            data.maintenance_message ||
              'অভ্যাস প্ল্যাটফর্মের নিয়মিত রক্ষণাবেক্ষণ চলছে। শীঘ্রই আমরা ফিরে আসছি।',
          );
        }
      } catch (e) {}
    }

    checkMaintenance();

    const channel = supabase
      .channel('app_config_maintenance')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config' },
        (payload: any) => {
          if (payload.new && isMounted) {
            setMaintenanceMode(payload.new.maintenance_mode || false);
            if (payload.new.maintenance_message) {
              setMessage(payload.new.maintenance_message);
            }
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Admins bypass maintenance mode to fix things
  const roleLower = String(profile?.role || '').toLowerCase();
  const isAdmin = roleLower === 'admin' || roleLower === 'super_admin';
  if (maintenanceMode && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
            <Wrench size={32} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">
              সার্ভার রক্ষণাবেক্ষণ চলছে
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {message}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 mx-auto shadow-lg shadow-emerald-950/40"
            >
              <RefreshCw size={15} />
              <span>পুনরায় চেষ্টা করুন</span>
            </button>
          </div>

          <p className="text-[11px] text-zinc-600">
            Obhyash Core Engine • Maintenance Mode
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
