'use client';

import { useEffect, useState } from 'react';
// ✅ New Import
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  Settings,
  Home,
  Monitor,
  Globe,
  AlertTriangle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { getUserProfile } from '@/services/database';
import { UserProfile } from '@/lib/types';
import UserAvatar from '@/components/student/ui/common/UserAvatar';

export function UserNav() {
  const [email, setEmail] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const router = useRouter();

  // ✅ New Client Initialization
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (authUser) {
          setEmail(authUser.email || '');
          const profile = await getUserProfile(authUser.id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <UserAvatar user={userProfile} size="sm" showBorder />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-60 bg-[#09090b] border border-white/10 text-gray-200 p-2"
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">
              {userProfile?.name || 'Admin'}
            </p>
            <p className="text-xs leading-none text-gray-500">
              {email || 'admin@hsc.com'}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10 rounded-md">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10 rounded-md">
            <Home className="mr-2 h-4 w-4" />
            <span>Back to App</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => router.push('/complaint')}
            className="cursor-pointer hover:bg-white/10 focus:bg-white/10 rounded-md text-red-400 font-medium"
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Report an Issue</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer hover:bg-white/10 focus:bg-white/10 rounded-md">
              <Monitor className="mr-2 h-4 w-4" />
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#09090b] border-white/10 text-gray-200 ml-2">
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                Light
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer hover:bg-white/10 focus:bg-white/10 rounded-md">
              <Globe className="mr-2 h-4 w-4" />
              <span>বাংলা</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#09090b] border-white/10 text-gray-200 ml-2">
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                English
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/10 cursor-pointer">
                Bangla
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-white/10" />

        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-900/20 focus:bg-red-900/20 rounded-md"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
