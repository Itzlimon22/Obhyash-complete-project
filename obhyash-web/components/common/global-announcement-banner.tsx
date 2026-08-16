'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export interface AnnouncementConfig {
  global_announcement_enabled: boolean;
  global_announcement_text: string;
  global_announcement_type: 'info' | 'warning' | 'success' | 'danger';
}

export function GlobalAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<AnnouncementConfig | null>(
    null,
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    // 1. Fetch initial config
    async function loadConfig() {
      try {
        const { data } = await supabase
          .from('app_config')
          .select('global_announcement_enabled, global_announcement_text, global_announcement_type')
          .eq('id', 'global_config')
          .maybeSingle();

        if (data && isMounted) {
          setAnnouncement(data as AnnouncementConfig);
        }
      } catch (e) {
        // Fallback silently if table not populated yet
      }
    }

    loadConfig();

    // 2. Realtime listener for instant broadcast
    const channel = supabase
      .channel('app_config_broadcast')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config' },
        (payload) => {
          if (payload.new && isMounted) {
            setAnnouncement(payload.new as AnnouncementConfig);
            setIsDismissed(false); // Re-show on new broadcast
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  if (
    !announcement ||
    !announcement.global_announcement_enabled ||
    !announcement.global_announcement_text ||
    isDismissed
  ) {
    return null;
  }

  const type = announcement.global_announcement_type || 'info';

  const typeStyles = {
    info: {
      bg: 'bg-blue-600 text-white',
      icon: Info,
    },
    warning: {
      bg: 'bg-amber-500 text-neutral-950 font-bold',
      icon: AlertTriangle,
    },
    success: {
      bg: 'bg-emerald-600 text-white',
      icon: CheckCircle2,
    },
    danger: {
      bg: 'bg-rose-600 text-white font-bold',
      icon: Megaphone,
    },
  }[type] || {
    bg: 'bg-emerald-600 text-white',
    icon: Megaphone,
  };

  const Icon = typeStyles.icon;

  return (
    <div
      className={`w-full py-2.5 px-4 ${typeStyles.bg} flex items-center justify-between text-xs sm:text-sm font-medium shadow-md transition-all animate-in slide-in-from-top duration-300 z-50`}
    >
      <div className="flex items-center gap-2.5 max-w-6xl mx-auto flex-1 pr-2">
        <Icon size={16} className="shrink-0 animate-pulse" />
        <span className="leading-snug">
          {announcement.global_announcement_text}
        </span>
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition shrink-0 cursor-pointer"
        title="Dismiss announcement"
      >
        <X size={16} />
      </button>
    </div>
  );
}
