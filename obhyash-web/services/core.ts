import { supabase } from '@/lib/utils/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export { supabase };

export const isSupabaseConfigured = () => !!supabaseUrl && !!supabaseKey;
