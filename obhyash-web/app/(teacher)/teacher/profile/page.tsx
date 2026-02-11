'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getUserProfile } from '@/services/user-service';
import { getTeacherStats } from '@/services/stats-service';
import TeacherProfileView from '@/components/teacher/ui/TeacherProfileView';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { UserProfile } from '@/lib/types';

export default function TeacherProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [stats, setStats] = useState<{
    totalQuestions: number;
    approved: number;
    pending: number;
    rejected: number;
  } | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const loadData = async () => {
        try {
          const [profileData, statsData] = await Promise.all([
            getUserProfile(user.id),
            user.email ? getTeacherStats(user.email) : null,
          ]);

          // Cast role to string to avoid TS error
          if (
            profileData &&
            ((profileData.role as string) === 'Teacher' ||
              (profileData.role as string) === 'teacher' ||
              profileData.role === 'Admin')
          ) {
            setProfile(profileData);
          } else {
            setProfile(profileData);
          }

          if (statsData) {
            setStats(statsData);
          }
        } catch (error) {
          console.error('Error loading profile/stats:', error);
        } finally {
          setFetching(false);
        }
      };

      loadData();
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

  return <TeacherProfileView user={profile} stats={stats || undefined} />;
}
