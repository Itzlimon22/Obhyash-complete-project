const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    const res = await supabase
      .from('exam_results')
      .select('id, created_at, users(name)')
      .gte(
        'created_at',
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      )
      .order('created_at', { ascending: false })
      .limit(5);
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}
test();
