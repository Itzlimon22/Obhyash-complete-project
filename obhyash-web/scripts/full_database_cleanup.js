const fs = require('fs');
const path = require('path');

// 1. Load credentials
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
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

// 2. Comprehensive, ultra-safe sanitizer
function sanitize(text) {
  if (!text || typeof text !== 'string') return text;
  let res = text;

  // HTML entities normalization
  res = res
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Control character repair: \b, \v, \t, \a, \f
  res = res
    // \b (backspace \u0008)
    .replace(/[\u0008]egin\b/g, '\\begin')
    .replace(/[\u0008]matrix\b/g, '\\bmatrix')
    .replace(/[\u0008]bullet\b/g, '\\bullet')
    .replace(/[\u0008]inom\b/g, '\\binom')
    .replace(/[\u0008]eta\b/g, '\\beta')
    .replace(/[\u0008]ar\b/g, '\\bar')
    .replace(/[\u0008]oldsymbol\b/g, '\\boldsymbol')
    .replace(/[\u0008]/g, '')
    // \v (vertical tab \u000b)
    .replace(/[\u000b\v]ec\b/g, '\\vec')
    .replace(/[\u000b\v]ec\{/g, '\\vec{')
    .replace(/[\u000b\v]matrix\b/g, '\\vmatrix')
    .replace(/[\u000b\v]ert\b/g, '\\vert')
    .replace(/[\u000b\v]/g, '')
    // \t (tab \u0009 before command)
    .replace(/[\t\u0009]ext\{/g, '\\text{')
    .replace(/[\t\u0009]imes\b/g, '\\times')
    .replace(/[\t\u0009]heta\b/g, '\\theta')
    .replace(/[\t\u0009]an\b/g, '\\tan')
    .replace(/[\t\u0009]au\b/g, '\\tau')
    .replace(/[\t\u0009]o\b/g, '\\to')
    .replace(/[\t\u0009]ilde\{/g, '\\tilde{')
    // \a (bell \u0007)
    .replace(/[\u0007]lpha\b/g, '\\alpha')
    .replace(/[\u0007]pprox\b/g, '\\approx')
    .replace(/[\u0007]/g, '')
    // \f (form feed \u000c)
    .replace(/[\u000c]rac\b/g, '\\frac')
    .replace(/[\u000c]orall\b/g, '\\forall')
    .replace(/[\u000c]/g, '')
    // Non-printable control characters (except standard \n and \t)
    .replace(/[\u0000-\u0006\u000e-\u001f\u007f]/g, '');

  // Isotope empty brace notation
  res = res.replace(/\\\{\}/g, '{}');

  // Matrix environments: strip internal $ and normalize single-backslash row breaks to double-backslash
  res = res.replace(/(\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array|align\*?)\}[\s\S]*?\\end\{\2\})/g, (match) => {
    let clean = match.replace(/\$/g, '');
    clean = clean.replace(/(?<=[^\\&])\s*\\\s+(?=[0-9a-zA-Z\-\+\&\.\,\(\)\{\}\\])/g, ' \\\\ ');
    return clean;
  });

  // Wrap bare matrices in $$...$$ if not inside math delimiters
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

async function runFullDatabaseCleanup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.resolve(__dirname, `../backups/full_db_backup_${timestamp}.json`);
  const logPath = path.resolve(__dirname, `../backups/full_db_audit_${timestamp}.log`);

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  console.log('--- STARTING FULL DATABASE CLEANUP ---');
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Backup Destination: ${backupPath}\n`);

  // Get total count
  const countRes = await fetch(`${supabaseUrl}/rest/v1/questions?select=id`, {
    method: 'HEAD',
    headers: { ...headers, 'Prefer': 'count=exact' }
  });
  const contentRange = countRes.headers.get('content-range');
  const totalCount = contentRange ? parseInt(contentRange.split('/')[1], 10) : 60934;
  console.log(`Total questions in database to scan: ${totalCount}`);

  const CHUNK_SIZE = 1000;
  const totalChunks = Math.ceil(totalCount / CHUNK_SIZE);
  
  let scannedCount = 0;
  let modifiedCount = 0;
  let successUpdateCount = 0;
  let failedUpdateCount = 0;

  const backupStream = fs.createWriteStream(backupPath, { flags: 'a', encoding: 'utf8' });
  backupStream.write('[\n');
  let isFirstBackup = true;

  const auditLogStream = fs.createWriteStream(logPath, { flags: 'a', encoding: 'utf8' });

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startRange = chunkIndex * CHUNK_SIZE;
    const endRange = Math.min(startRange + CHUNK_SIZE - 1, totalCount - 1);

    const chunkHeaders = {
      ...headers,
      'Range': `${startRange}-${endRange}`
    };

    let attempts = 0;
    let data = null;
    while (attempts < 3) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/questions?select=id,question,options,explanation&order=id.asc`, {
          headers: chunkHeaders
        });
        if (res.ok) {
          data = await res.json();
          break;
        } else {
          throw new Error(`Status ${res.status}: ${await res.text()}`);
        }
      } catch (err) {
        attempts++;
        console.warn(`\n[Chunk ${chunkIndex + 1}/${totalChunks}] Fetch attempt ${attempts} failed: ${err.message}. Retrying in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!data) {
      console.error(`Failed to fetch chunk ${chunkIndex + 1} after 3 attempts. Aborting.`);
      break;
    }

    scannedCount += data.length;

    // Scan for changes
    const chunkUpdates = [];
    for (const q of data) {
      const newQ = sanitize(q.question);
      const newOpts = Array.isArray(q.options) ? q.options.map(o => sanitize(o)) : q.options;
      const newExp = sanitize(q.explanation);

      const patchBody = {};
      if (newQ !== q.question) patchBody.question = newQ;
      if (JSON.stringify(newOpts) !== JSON.stringify(q.options)) patchBody.options = newOpts;
      if (newExp !== q.explanation) patchBody.explanation = newExp;

      if (Object.keys(patchBody).length > 0) {
        chunkUpdates.push({
          id: q.id,
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

    // Apply updates if any in this chunk
    if (chunkUpdates.length > 0) {
      modifiedCount += chunkUpdates.length;

      // 1. Write to backup stream
      for (const item of chunkUpdates) {
        const prefix = isFirstBackup ? '' : ',\n';
        backupStream.write(prefix + JSON.stringify(item.original, null, 2));
        isFirstBackup = false;

        auditLogStream.write(`[MODIFIED ${item.id}]\nPATCH: ${JSON.stringify(item.patchBody)}\n\n`);
      }

      // 2. Safe PATCH in small sub-batches of 10 (NO DELETES)
      const subBatchSize = 10;
      for (let s = 0; s < chunkUpdates.length; s += subBatchSize) {
        const sub = chunkUpdates.slice(s, s + subBatchSize);
        await Promise.all(sub.map(async (item) => {
          try {
            const pRes = await fetch(`${supabaseUrl}/rest/v1/questions?id=eq.${item.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify(item.patchBody)
            });
            if (pRes.ok) {
              successUpdateCount++;
            } else {
              failedUpdateCount++;
              console.error(`\nFailed to update row ${item.id}:`, await pRes.text());
            }
          } catch (pErr) {
            failedUpdateCount++;
            console.error(`\nError updating row ${item.id}:`, pErr.message);
          }
        }));
      }
    }

    process.stdout.write(`\rProgress: Chunk [${chunkIndex + 1}/${totalChunks}] | Scanned: ${scannedCount}/${totalCount} | Issues Fixed: ${successUpdateCount} | Failed: ${failedUpdateCount}`);
  }

  backupStream.write('\n]\n');
  backupStream.end();
  auditLogStream.end();

  console.log(`\n\n--- FULL DATABASE CLEANUP COMPLETE ---`);
  console.log(`Total questions scanned: ${scannedCount}`);
  console.log(`Total questions modified: ${modifiedCount}`);
  console.log(`Successfully updated: ${successUpdateCount}`);
  console.log(`Failed updates: ${failedUpdateCount}`);
  console.log(`Zero rows deleted.`);
  console.log(`Complete original backup: ${backupPath}`);
  console.log(`Detailed audit log: ${logPath}`);
}

runFullDatabaseCleanup().catch(console.error);
