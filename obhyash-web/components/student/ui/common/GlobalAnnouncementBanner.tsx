"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/services/core";
import {
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  Info,
  X,
} from "lucide-react";

interface AppConfigAnnouncement {
  global_announcement_enabled?: boolean;
  global_announcement_text?: string;
  global_announcement_type?: "warning" | "success" | "danger" | "info" | string;
}

export const GlobalAnnouncementBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState<AppConfigAnnouncement | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    let channel: any = null;

    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("app_config")
          .select("global_announcement_enabled, global_announcement_text, global_announcement_type")
          .eq("id", "global_config")
          .maybeSingle();

        if (error) {
          console.warn("[GlobalAnnouncementBanner] fetch error:", error);
          return;
        }

        if (data) {
          setAnnouncement(data);
          const dismissedKey = `dismissed_announcement_${data.global_announcement_text}`;
          if (sessionStorage.getItem(dismissedKey)) {
            setIsDismissed(true);
          } else {
            setIsDismissed(false);
          }
        }
      } catch (err) {
        console.warn("[GlobalAnnouncementBanner] error:", err);
      }
    };

    fetchConfig();

    // Subscribe to realtime changes in app_config
    try {
      channel = supabase
        .channel("app_config_announcements")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "app_config",
            filter: "id=eq.global_config",
          },
          (payload: any) => {
            if (payload?.new) {
              setAnnouncement(payload.new);
              setIsDismissed(false);
            }
          }
        )
        .subscribe();
    } catch (e) {
      console.warn("[GlobalAnnouncementBanner] realtime subscription error:", e);
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  if (
    !announcement ||
    !announcement.global_announcement_enabled ||
    !announcement.global_announcement_text?.trim() ||
    isDismissed
  ) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (announcement.global_announcement_text) {
      sessionStorage.setItem(
        `dismissed_announcement_${announcement.global_announcement_text}`,
        "true"
      );
    }
  };

  const type = announcement.global_announcement_type || "info";

  let bgClass = "bg-[#2563EB] text-white shadow-[#2563EB]/25";
  let IconComponent = Info;

  if (type === "warning") {
    bgClass = "bg-[#F59E0B] text-neutral-950 shadow-[#F59E0B]/25";
    IconComponent = AlertTriangle;
  } else if (type === "success") {
    bgClass = "bg-[#10B981] text-white shadow-[#10B981]/25";
    IconComponent = CheckCircle2;
  } else if (type === "danger") {
    bgClass = "bg-[#EF4444] text-white shadow-[#EF4444]/25";
    IconComponent = Megaphone;
  }

  return (
    <div
      className={`w-full mx-auto mb-3.5 px-3.5 py-2.5 rounded-2xl shadow-md flex items-center justify-between gap-3 font-['HindSiliguri'] transition-all ${bgClass}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <IconComponent className="w-5 h-5 shrink-0" />
        <p className="text-[13.5px] sm:text-sm font-semibold leading-snug line-clamp-2">
          {announcement.global_announcement_text}
        </p>
      </div>

      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-black/15 transition-colors shrink-0 cursor-pointer"
        aria-label="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default GlobalAnnouncementBanner;
