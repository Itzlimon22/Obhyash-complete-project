const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
let envFile = '';
if (fs.existsSync(envPath)) {
  envFile = fs.readFileSync(envPath, 'utf8');
}

let supabaseUrl = '';
let supabaseKey = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE credentials in .env.local');
  process.exit(1);
}

function sanitize(text) {
  if (!text || typeof text !== 'string') return text;
  let res = text;

  // Non-printable control characters
  res = res
    .replace(/[\u0008]egin\b/g, '\\begin')
    .replace(/[\u0008]matrix\b/g, '\\bmatrix')
    .replace(/[\u0008]/g, '')
    .replace(/[\u000b\v]matrix\b/g, '\\vmatrix')
    .replace(/[\u000b\v]/g, '')
    .replace(/[\u0000-\u0006\u000e-\u001f]/g, '');

  // Matrix environments: strip internal $ and normalize single-backslash row breaks to double-backslash
  res = res.replace(/(\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array|align\*?)\}[\s\S]*?\\end\{\2\})/g, (match) => {
    let clean = match.replace(/\$/g, ''); // strip illegal dollar signs inside matrix cells
    // replace single backslash row breaks (e.g. ' 1 \ 2 ' -> ' 1 \\ 2 ')
    clean = clean.replace(/(?<=[^\\&])\s*\\\s+(?=[0-9a-zA-Z\-\+\&\.\,\(\)\{\}\\])/g, ' \\\\ ');
    return clean;
  });

  // Only wrap bare matrix environments that are NOT already inside $...$ or $$...$$
  const mathBlockRegex = /(\$\$[\s\S]*?\$\$|\$[^\$\n]*?\$)/g;
  const parts = [];
  let lastIndex = 0;
  let m;
  while ((m = mathBlockRegex.exec(res)) !== null) {
    const nonMath = res.substring(lastIndex, m.index);
    const wrappedNonMath = nonMath.replace(
      /(\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array)\}[\s\S]*?\\end\{\2\})/g,
      '$$$$$1$$$$'
    );
    parts.push(wrappedNonMath);
    parts.push(m[0]);
    lastIndex = mathBlockRegex.lastIndex;
  }
  const remainingNonMath = res.substring(lastIndex);
  const wrappedRemaining = remainingNonMath.replace(
    /(\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array)\}[\s\S]*?\\end\{\2\})/g,
    '$$$$$1$$$$'
  );
  parts.push(wrappedRemaining);

  res = parts.join('');

  // Collapse 3 or more dollars to 2
  res = res.replace(/\${3,}/g, '$$$$');

  return res;
}

async function runSanitization() {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  console.log('Fetching candidate questions from Supabase...');
  const [r1, r2, r3] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/questions?select=id,question,options,explanation&chapter=ilike.*ম্যাট্রিক্স*&limit=1000`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/questions?select=id,question,options,explanation&question=ilike.*begin%7B*&limit=1000`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/questions?select=id,question,options,explanation&explanation=ilike.*begin%7B*&limit=1000`, { headers }),
  ]);

  const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
  const map = new Map();
  [...d1, ...d2, ...d3].forEach(q => map.set(q.id, q));

  console.log(`Total candidate questions examined: ${map.size}`);

  const toUpdate = [];
  for (const [id, q] of map.entries()) {
    const newQ = sanitize(q.question);
    const newOpts = Array.isArray(q.options) ? q.options.map(o => sanitize(o)) : q.options;
    const newExp = sanitize(q.explanation);

    const patchBody = {};
    if (newQ !== q.question) patchBody.question = newQ;
    if (JSON.stringify(newOpts) !== JSON.stringify(q.options)) patchBody.options = newOpts;
    if (newExp !== q.explanation) patchBody.explanation = newExp;

    if (Object.keys(patchBody).length > 0) {
      toUpdate.push({
        id,
        patchBody,
        original: {
          id: q.id,
          question: q.question,
          options: q.options,
          explanation: q.explanation
        }
      });
    }
  }

  console.log(`Found ${toUpdate.length} rows that need sanitization.`);

  if (toUpdate.length === 0) {
    console.log('No rows need update. Everything is already clean!');
    return;
  }

  // 1. SAFETY FIRST: Save full backup of original records
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.resolve(__dirname, `../backups/questions_backup_${timestamp}.json`);
  const backupData = toUpdate.map(u => u.original);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`\n[SAFETY CHECK PASSED] Full backup of ${backupData.length} original records saved to:`);
  console.log(`-> ${backupFile}`);

  // 2. Execute PATCH updates (NO DELETES WHATSOEVER)
  console.log(`\nBeginning safe PATCH updates in batches...`);
  let successCount = 0;
  let failCount = 0;

  const batchSize = 10;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = toUpdate.slice(i, i + batchSize);
    await Promise.all(batch.map(async (item) => {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/questions?id=eq.${item.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(item.patchBody)
        });

        if (res.ok) {
          successCount++;
        } else {
          const errText = await res.text();
          console.error(`Failed to update ${item.id}:`, errText);
          failCount++;
        }
      } catch (err) {
        console.error(`Error updating ${item.id}:`, err.message);
        failCount++;
      }
    }));

    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, toUpdate.length)} / ${toUpdate.length} processed (${successCount} succeeded, ${failCount} failed)`);
  }

  console.log(`\n\n--- COMPLETED ---`);
  console.log(`Successfully updated: ${successCount} rows`);
  console.log(`Failed: ${failCount} rows`);
  console.log(`Zero rows deleted. All other data untouched.`);
}

runSanitization().catch(console.error);
