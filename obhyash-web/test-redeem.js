const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

async function run() {
  // Get a referral code
  const refRes = await fetch(`${supabaseUrl}/rest/v1/referrals?select=*&limit=1`, {
    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
  });
  const refs = await refRes.json();
  if (!refs || refs.length === 0) return console.log("No referrals found.");
  const referral = refs[0];
  
  console.log("Testing with referral:", referral.code);
  
  // Try inserting into history with a dummy UUID that doesn't exist in users
  const dummyUUID = '123e4567-e89b-12d3-a456-426614174000';
  
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/referral_history`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      referral_id: referral.id,
      redeemed_by: dummyUUID,
      redeemed_at: new Date().toISOString(),
      admin_status: 'Pending',
      reward_given: false
    })
  });
  
  const insertData = await insertRes.json();
  console.log("Insert Response Status:", insertRes.status);
  console.log("Insert Response Data:", insertData);
}

run();
