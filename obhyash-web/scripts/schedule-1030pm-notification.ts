import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { dispatchAutomatedWittyNotification } from '../lib/notification-cron-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const sb = createClient(supabaseUrl, supabaseServiceKey);

async function startAutoScheduler() {
  const now = new Date();
  console.log(`[Scheduler] Current local time: ${now.toLocaleTimeString()} (${now.toISOString()})`);

  // Target time: 22:32:00 today
  const target = new Date();
  target.setHours(22, 32, 0, 0);

  let delayMs = target.getTime() - now.getTime();

  if (delayMs <= 0) {
    console.log('[Scheduler] 22:32 has already passed or is right now! Dispatching immediately...');
    delayMs = 0;
  } else {
    const minutes = Math.floor(delayMs / 60000);
    const seconds = Math.floor((delayMs % 60000) / 1000);
    console.log(`[Scheduler] ⏰ Auto-dispatch armed for 10:32 PM sharp! Waiting ${minutes}m ${seconds}s (${delayMs} ms)...`);
  }

  setTimeout(async () => {
    const fireTime = new Date();
    console.log(`\n======================================================`);
    console.log(`[Scheduler] 🚀 10:32 PM REACHED! (${fireTime.toLocaleTimeString()})`);
    console.log(`[Scheduler] Dispatched Chorcha/Duolingo style 10:32 PM Night Streak Notification...`);
    console.log(`======================================================\n`);

    try {
      const result = await dispatchAutomatedWittyNotification(sb, 'night_streak');
      console.log('✅ Automated 10:30 PM Notification Sent Successfully!');
      console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
      console.error('❌ Failed to dispatch automated notification:', err);
    }
  }, delayMs);
}

startAutoScheduler();
