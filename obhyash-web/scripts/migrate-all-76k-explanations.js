require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function structureExplanation(raw) {
  if (!raw || !raw.trim()) return raw;
  let text = raw.trim();

  // 0. Remove trailing markdown horizontal lines artifacts like \n\n---\n\n---
  text = text.replace(/(\n*\s*---\s*)+$/g, '').trim();

  // 1. Convert chained \Rightarrow, \implies math steps to \begin{aligned} ... \end{aligned}
  // Case A: Inside $...$ delimiters: e.g. $A \Rightarrow B \Rightarrow C$
  text = text.replace(/\$([^\$\n]*(?:\\Rightarrow|\\implies|⇒|⟹)[^\$\n]*)\$/g, (m, math) => {
    if (/[\u0980-\u09FF]/.test(math)) return m;
    const steps = math.split(/\s*(?:\\Rightarrow|\\implies|⇒|⟹)\s*/).filter(Boolean);
    if (steps.length < 2) return m;

    const alignedSteps = steps.map(step => {
      let s = step.trim().replace(/^[\,\;\.]+|[\,\;\.]+$/g, '');
      if (s.includes('=') && !s.includes('&=')) {
        s = s.replace('=', '&=');
      } else {
        s = '& ' + s;
      }
      return s;
    });

    return `\n\n\\begin{aligned}\n  ${alignedSteps.join(' \\\\\n  ')}\n\\end{aligned}\n\n`;
  });

  // Case B: Raw equations with \Rightarrow not wrapped in $...$
  text = text.replace(/([0-9a-zA-Z\s\(\)\+\-\*\/\^\_\\\{\}\.\=]+\s*(?:\\Rightarrow|\\implies|⇒|⟹)\s*[0-9a-zA-Z\s\(\)\+\-\*\/\^\_\\\{\}\.\=\\Rightarrow\\implies⇒⟹]+)/g, (m, math) => {
    if (math.includes('\\begin{aligned}') || math.includes('\\end{aligned}')) return m;
    if (/[\u0980-\u09FF]/.test(math)) return m;
    const steps = math.split(/\s*(?:\\Rightarrow|\\implies|⇒|⟹)\s*/).filter(Boolean);
    if (steps.length < 2) return m;

    const alignedSteps = steps.map(step => {
      let s = step.trim().replace(/^[\,\;\.]+|[\,\;\.]+$/g, '');
      if (s.includes('=') && !s.includes('&=')) {
        s = s.replace('=', '&=');
      } else {
        s = '& ' + s;
      }
      return s;
    });

    return `\n\n\\begin{aligned}\n  ${alignedSteps.join(' \\\\\n  ')}\n\\end{aligned}\n\n`;
  });

  // 1b. Clean up stray punctuation attached right after \end{aligned}
  text = text.replace(/\\end\{aligned\}\s*[\$\।\.]+/g, '\\end{aligned}');

  // 2. Separate step preambles: "এখানে,", "আমরা জানি,", "দেওয়া আছে,", "শর্তমতে,", "সূত্রানুসারে,", "মান বসিয়ে পাই,"
  text = text.replace(/([।\?\!\;])\s*(এখানে[,\s]|আমরা জানি[,\s]|দেওয়া আছে[,\s]|দেয়া আছে[,\s]|শর্তমতে[,\s]|সূত্রানুসারে[,\s]|মান বসিয়ে পাই[,\s]|মান বসিয়ে পাই[,\s]|প্রশ্নমতে[,\s]|লব্ধির মান|বলের ঘাত|গতিশক্তি ও ভরবেগের)/g, (_m, p1, p2) => `${p1}\n\n${p2}`);

  // 3. Separate concluding sentences: "সুতরাং,", "অতএব,"
  text = text.replace(/([।\.\!\?]|\\end\{aligned\}|\$)\s*(সুতরাং[,\s]|অতএব[,\s])/g, (_m, p1, p2) => `${p1}\n\n${p2}`);

  // 4. Ensure \begin{aligned} has double newlines before and after
  text = text.replace(/([^\n])\s*(\\begin\{(?:aligned|align\*?)\})/g, (_m, p1, p2) => `${p1}\n\n${p2}`);
  text = text.replace(/(\\end\{(?:aligned|align\*?)\})\s*([^\n])/g, (_m, p1, p2) => `${p1}\n\n${p2}`);

  // 5. Separate notes / shortcuts: "*দ্রষ্টব্য:*", "💡", "**Shortcut"
  text = text.replace(/([।\?\!\$])\s*(\*?দ্রষ্টব্য|\*?নোট|💡|\*\*Shortcut|\*\*Tips)/g, (_m, p1, p2) => `${p1}\n\n${p2}`);

  // 6. Clean up any trailing/leading stray punctuation or double newlines
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

async function runFullMigration() {
  console.log('🚀 Starting Full Explanation Migration across all 76,500+ questions...');
  let totalProcessed = 0;
  let totalUpdated = 0;
  let lastId = null;

  const BATCH_SIZE = 1000;
  const UPDATE_CONCURRENCY = 30;

  while (true) {
    let query = supabase
      .from('questions')
      .select('id, explanation')
      .order('id', { ascending: true })
      .limit(BATCH_SIZE);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching batch:', error);
      break;
    }
    if (!data || data.length === 0) break;

    const toUpdate = [];
    for (const q of data) {
      if (!q.explanation) continue;
      const formatted = structureExplanation(q.explanation);
      if (formatted !== q.explanation) {
        toUpdate.push({ id: q.id, explanation: formatted });
      }
    }

    if (toUpdate.length > 0) {
      for (let i = 0; i < toUpdate.length; i += UPDATE_CONCURRENCY) {
        const chunk = toUpdate.slice(i, i + UPDATE_CONCURRENCY);
        await Promise.all(
          chunk.map(async item => {
            const { error: upErr } = await supabase
              .from('questions')
              .update({ explanation: item.explanation })
              .eq('id', item.id);

            if (upErr) {
              console.error(`Failed to update ${item.id}:`, upErr.message);
            } else {
              totalUpdated++;
            }
          })
        );
      }
    }

    totalProcessed += data.length;
    lastId = data[data.length - 1].id;

    if (totalProcessed % 5000 === 0 || totalProcessed >= 76000) {
      console.log(`[PROGRESS] Processed ${totalProcessed} / ~76,502 questions | Updated so far: ${totalUpdated}`);
    }
  }

  console.log(`\n🎉 Full migration finished!`);
  console.log(`Total questions checked: ${totalProcessed}`);
  console.log(`Total explanations updated: ${totalUpdated}`);
}

runFullMigration();
