'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { getDeviceToken } from '@/services/device-session-service';

interface Device {
  id: string;
  device_name: string;
  device_type: 'web' | 'mobile' | 'tablet';
  ip_address: string | null;
  last_active: string;
  created_at: string;
  device_token: string;
}

const DEVICE_LIMIT = 2;

function DeviceIcon({ type }: { type: string }) {
  const cls = 'w-5 h-5';
  if (type === 'mobile') return <Smartphone className={cls} />;
  if (type === 'tablet') return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'এইমাত্র';
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  return `${Math.floor(hrs / 24)} দিন আগে`;
}

export default function ManageDevicesPanel({ userId }: { userId: string }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const currentToken = getDeviceToken();

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/devices');
      if (!res.ok) throw new Error('Failed to load');
      const { devices: data } = (await res.json()) as { devices: Device[] };
      setDevices(data ?? []);
    } catch {
      // silently fail — user can refresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchDevices();
  }, [userId, fetchDevices]);

  const handleRemove = async (deviceId: string) => {
    setRemovingId(deviceId);
    try {
      const res = await fetch('/api/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId }),
      });
      if (!res.ok) throw new Error('Failed to remove');
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
    } catch {
      // keep UI unchanged
    } finally {
      setRemovingId(null);
    }
  };

  const used = devices.length;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header card */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
              লগইন ডিভাইস
            </h3>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
              সর্বোচ্চ {DEVICE_LIMIT}টি ডিভাইস একসাথে লগইন রাখতে পারবে
            </p>
          </div>
          <button
            onClick={fetchDevices}
            disabled={loading}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Capacity bar */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              ব্যবহৃত স্লট
            </span>
            <span
              className={`text-sm font-bold ${used >= DEVICE_LIMIT ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}
            >
              {used} / {DEVICE_LIMIT}
            </span>
          </div>
          <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${used >= DEVICE_LIMIT ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{
                width: `${Math.min((used / DEVICE_LIMIT) * 100, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Device list */}
        <div className="p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          ) : devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShieldCheck className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mb-3" />
              <p className="text-sm text-neutral-500">
                কোনো ডিভাইস পাওয়া যায়নি
              </p>
            </div>
          ) : (
            devices.map((device) => {
              const isCurrent = device.device_token === currentToken;
              return (
                <div
                  key={device.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10'
                      : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'}`}
                  >
                    <DeviceIcon type={device.device_type} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                        {device.device_name}
                      </span>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          এই ডিভাইস
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      সক্রিয়: {timeAgo(device.last_active)}
                      {device.ip_address && (
                        <span className="ml-2 text-neutral-300 dark:text-neutral-600">
                          · {device.ip_address}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemove(device.id)}
                    disabled={removingId === device.id}
                    title={
                      isCurrent ? 'এই ডিভাইস থেকে লগ আউট হবে' : 'ডিভাইস সরাও'
                    }
                    className="shrink-0 p-2 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-50"
                  >
                    {removingId === device.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info note */}
      <div className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            নিরাপত্তা টিপস
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
            অচেনা ডিভাইস দেখলে অবিলম্বে সরিয়ে দাও এবং পাসওয়ার্ড পরিবর্তন করো।
            ডিভাইস সরালে সেই ডিভাইস থেকে স্বয়ংক্রিয়ভাবে লগ আউট হবে।
          </p>
        </div>
      </div>
    </div>
  );
}
