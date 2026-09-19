const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runAudit() {
  const adminApiDir = path.join(__dirname, '..', 'app', 'api', 'admin');
  const files = [];

  function walk(dir) {
    for (const item of fs.readdirSync(dir)) {
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (item.endsWith('.ts')) files.push(full);
    }
  }
  walk(adminApiDir);

  const tableRegex = /\.from\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/g;
  const selectRegex = /\.select\(\s*['"`]([^'"`]+)['"`]/g;
  const updateRegex = /\.update\(\s*\{([^}]+)\}\s*\)/g;
  const insertRegex = /\.insert\(\s*\{([^}]+)\}\s*\)/g;

  const tableUsages = new Map(); // table -> Set of files

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = tableRegex.exec(content)) !== null) {
      const table = m[1];
      if (!tableUsages.has(table)) tableUsages.set(table, new Set());
      tableUsages.get(table).add(path.relative(path.join(__dirname, '..'), file));
    }
  }

  console.log('--- 1. TABLE EXISTENCE AUDIT ---');
  const missingTables = [];
  const existingTables = {};

  for (const [table, fileSet] of tableUsages.entries()) {
    const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Table '${table}' NOT FOUND! Used in:`, Array.from(fileSet));
      missingTables.push({ table, error: error.message, files: Array.from(fileSet) });
    } else {
      existingTables[table] = data && data[0] ? Object.keys(data[0]) : [];
      console.log(`✅ Table '${table}' exists. (Found ${existingTables[table].length} cols)`);
    }
  }

  console.log('\n--- 2. COLUMN AUDIT ON EXISTING TABLES ---');
  // Check updates and inserts on existing tables to see if they refer to non-existent columns
  const columnIssues = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(path.join(__dirname, '..'), file);

    // Look for patterns like .from('table').update({ ... })
    const chainedOps = content.match(/\.from\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)\s*\.(update|insert)\(\s*\{([\s\S]*?)\}\s*\)/g);
    if (chainedOps) {
      for (const op of chainedOps) {
        const tMatch = op.match(/\.from\(\s*['"`]([a-zA-Z0-9_]+)['"`]\s*\)/);
        const tableName = tMatch ? tMatch[1] : null;
        if (tableName && existingTables[tableName] && existingTables[tableName].length > 0) {
          const bodyMatch = op.match(/\.(?:update|insert)\(\s*\{([\s\S]*?)\}\s*\)/);
          if (bodyMatch) {
            const bodyStr = bodyMatch[1];
            // extract keys
            const keyMatches = bodyStr.match(/([a-zA-Z0-9_]+)\s*:/g);
            if (keyMatches) {
              for (const k of keyMatches) {
                const col = k.replace(':', '').trim();
                // ignore JS variables or dynamic computed keys
                if (!['metadata', 'action'].includes(col) && !existingTables[tableName].includes(col)) {
                  console.log(`⚠️ Potential missing column '${col}' on table '${tableName}' in ${relFile}`);
                  columnIssues.push({ table: tableName, column: col, file: relFile });
                }
              }
            }
          }
        }
      }
    }
  }

  console.log('\nAudit Summary:');
  console.log('Missing Tables:', missingTables);
  console.log('Column Issues:', columnIssues);
}

runAudit();
