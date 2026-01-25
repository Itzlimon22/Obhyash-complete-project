'use client';

import { useEffect, useState } from 'react';
import { 
  LogOut, 
  Settings, 
  Monitor, 
  Globe, 
  Home, 
  ChevronRight,
  User
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
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu'; 
// Note: If you don't have the shadcn DropdownMenu installed yet, 
// run: npx shadcn-ui@latest add dropdown-menu

export function UserNav() {
  const [email, setEmail] = useState<string>('');
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email || '');
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="outline-none relative h-9 w-9 rounded-full bg-[#27272a] hover:bg-[#3f3f46] flex items-center justify-center text-white font-medium border border-white/10 transition-colors">
          {email ? email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56 bg-[#09090b] border-white/10 text-gray-200" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">Admin</p>
            <p className="text-xs leading-none text-muted-foreground text-gray-500">
              {email || 'admin@hsc.com'}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
            <Home className="mr-2 h-4 w-4" />
            <span>Back to App</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuGroup>
          {/* Theme Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
              <Monitor className="mr-2 h-4 w-4" />
              <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#09090b] border-white/10 text-gray-200">
              <DropdownMenuItem className="hover:bg-white/10">Light</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/10">Dark</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/10">System</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Language Submenu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
              <Globe className="mr-2 h-4 w-4" />
              <span>বাংলা</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="bg-[#09090b] border-white/10 text-gray-200">
              <DropdownMenuItem className="hover:bg-white/10">English</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-white/10">Bangla</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-white/10" />
        
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}