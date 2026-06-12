const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xxx.supabase.co', 'xxx');
async function run() {
  try {
    const { data, error } = await supabase.from('tbl').select('*').eq('id', undefined);
    console.log(error);
  } catch (err) {
    console.log("CAUGHT THROW:", err.message);
  }
}
run();
