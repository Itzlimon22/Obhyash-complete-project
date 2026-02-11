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

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const loadProfile = async () => {
        try {
          const data = await getUserProfile(user.id);
          // Cast role to string to avoid TS error: "Types have no overlap"
          if (
            data &&
            ((data.role as string) === 'Teacher' ||
              (data.role as string) === 'teacher' ||
              data.role === 'Admin')
          ) {
            setProfile(data);
          } else {
            // Optional: Handle wrong role, maybe redirect to student dashboard?
            // For now just allow viewing or redirect to login
            // router.push('/login');
            setProfile(data); // Let's try to show it anyway for debugging
          }
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
    return null; // or error state
  }

  // TODO: Fetch real stats from stats-service
  const stats = {
    totalQuestions: 154,
    approved: 142,
    pending: 8,
    rejected: 4,
  };

  return <TeacherProfileView user={profile} stats={stats} />;
}
