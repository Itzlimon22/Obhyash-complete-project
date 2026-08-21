const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCols() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (data && data[0]) {
    console.log("Users columns:", Object.keys(data[0]));
  }
  const { data: refData } = await supabase.from('referrals').select('*').limit(1);
  if (refData && refData[0]) {
    console.log("Referrals columns:", Object.keys(refData[0]));
  }
}
checkCols();
