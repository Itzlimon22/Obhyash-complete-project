import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('app_complaints')
    .select('*, user:users!inner(name, email)')
    .limit(1);
    
  if (error) {
    console.error('Error with inner join:', error);
    
    // Fallback test
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('app_complaints')
      .select('*')
      .limit(1);
      
    if (fallbackError) {
      console.error('Fallback error:', fallbackError);
    } else {
      console.log('Fallback success. Columns:', fallbackData.length > 0 ? Object.keys(fallbackData[0]) : 'empty table');
    }
  } else {
    console.log('Success!', data);
  }
}
test();
