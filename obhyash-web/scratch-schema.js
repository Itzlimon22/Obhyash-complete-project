import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  // Query a single row just to see the columns, or use the postgrest endpoint.
  const { data, error } = await supabase.from('exam_results').select('*').limit(1);
  console.log("Cols:", data ? Object.keys(data[0] || {}) : [], "Err:", error);
}
check();
