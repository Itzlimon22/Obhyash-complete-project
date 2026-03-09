'use client';

import { useState } from 'react';
import {
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeviceSession } from '@/services/device-session-service';
import { getDeviceToken } from '@/services/device-session-service';
import { useAuth } from '@/components/auth/AuthProvider';

interface ManageDevicesModalProps {
  open: boolean;
  /** Called when the user successfully removes a device and the limit is now satisfied */
  onDeviceRemoved: () => void;
  limit: number;
  plan: string;
  initialDevices: DeviceSession[];
}

function DeviceIcon({ type }: { type: string }) {
  if (type === 'mobile')
    return <Smartphone className="h-5 w-5 text-muted-foreground" />;
  if (type === 'tablet')
    return <Tablet className="h-5 w-5 text-muted-foreground" />;
  return <Monitor className="h-5 w-5 text-muted-foreground" />;
}

function timeAgo(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'এইমাত্র';
  if (mins < 60) return `${mins} মিনিট আগে`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ঘণ্টা আগে`;
  const days = Math.floor(hrs / 24);
  return `${days} দিন আগে`;
}

export function ManageDevicesModal({
  open,
  onDeviceRemoved,
  limit,
  plan,
  initialDevices,
}: ManageDevicesModalProps) {
  const [devices, setDevices] = useState<DeviceSession[]>(initialDevices);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const currentToken = getDeviceToken();
  const { signOut } = useAuth();

  const handleRemove = async (deviceId: string, isCurrent: boolean) => {
    setRemovingId(deviceId);
    try {
      const res = await fetch('/api/devices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId }),
      });

      if (!res.ok) throw new Error('Failed to remove device');

      const updated = devices.filter((d) => d.id !== deviceId);
      setDevices(updated);

      if (isCurrent) {
        // Removed our own device from the blocked modal — sign out
        await signOut();
        return;
      }

      // If we're now under the limit, notify parent to retry registration
      if (updated.length < limit) {
        onDeviceRemoved();
      }
    } catch {
      // Keep UI in place — user can retry
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()} // block dismiss — must act
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <DialogTitle>ডিভাইস সীমা পূর্ণ</DialogTitle>
          </div>
          <DialogDescription>
            আপনার <strong>{plan}</strong> প্ল্যানে সর্বোচ্চ{' '}
            <strong>{limit}টি</strong> ডিভাইস অনুমোদিত। নতুন ডিভাইসে লগইন করতে
            নিচের তালিকা থেকে একটি ডিভাইস সরান।
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          {devices.map((device) => {
            const isCurrent = device.device_token === currentToken;
            return (
              <div
                key={device.id}
                className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30"
              >
                <DeviceIcon type={device.device_type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {device.device_name}
                    </span>
                    {isCurrent && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        এই ডিভাইস
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    সক্রিয়: {timeAgo(device.last_active)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={removingId === device.id}
                  onClick={() => handleRemove(device.id, isCurrent)}
                >
                  {removingId === device.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
