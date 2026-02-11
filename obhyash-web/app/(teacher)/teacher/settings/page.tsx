'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getUserProfile } from '@/services/user-service';
import TeacherSettingsView from '@/components/teacher/ui/TeacherSettingsView';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';

export default function TeacherSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const loadProfile = async () => {
        try {
          const data = await getUserProfile(user.id);
          setProfile(data);
        } catch (error) {
          console.error('Error loading profile:', error);
        } finally {
          setFetching(false);
        }
      };

      loadProfile();
    }
  }, [user, loading, router]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return <TeacherSettingsView user={profile} />;
}
