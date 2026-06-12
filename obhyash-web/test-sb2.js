const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://example.supabase.co', 'eyJh...');
async function run() {
  try {
    const { data, error } = await supabase.from('tbl').select('*').eq('id', undefined);
    console.log("Error:", error);
  } catch (err) {
    console.log("CAUGHT THROW:", err.message);
  }
}
run();
