import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
    
    // Clear cookies explicitly on response
    response.cookies.delete('obhyash_role_cache');
    response.cookies.delete('obhyash_user_profile');

    return response;
  } catch (error) {
    console.error('Error during signout:', error);
    const response = NextResponse.json({ success: true, message: 'Signed out with fallback' });
    response.cookies.delete('obhyash_role_cache');
    return response;
  }
}
