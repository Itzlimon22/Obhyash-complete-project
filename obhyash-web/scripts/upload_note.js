const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'notes-pdfs';

async function uploadFile(localFilePath, targetR2Path) {
  if (!fs.existsSync(localFilePath)) {
    console.error(`Error: Local file not found: ${localFilePath}`);
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(localFilePath);
  const cleanPath = targetR2Path.startsWith('/') ? targetR2Path.substring(1) : targetR2Path;

  console.log(`Uploading ${localFilePath} to R2 (${BUCKET_NAME}/${cleanPath})...`);

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: cleanPath,
        Body: fileBuffer,
        ContentType: 'application/pdf',
      })
    );

    console.log(`✅ Upload successful!`);
    console.log(`🔗 Public URL: https://notes.obhyash.com/${cleanPath}`);
  } catch (err) {
    console.error(`❌ Upload failed:`, err.message);
    process.exit(1);
  }
}

async function listFiles(prefix = '') {
  try {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      })
    );
    console.log(`\nFiles in "${BUCKET_NAME}" (prefix: "${prefix}"):`);
    if (res.Contents && res.Contents.length > 0) {
      res.Contents.forEach((c) => {
        console.log(` - ${c.Key} (${(c.Size / 1024).toFixed(1)} KB)`);
      });
    } else {
      console.log(' (No files found)');
    }
  } catch (err) {
    console.error('Error listing files:', err.message);
  }
}

async function syncManifest() {
  console.log(`\n🔄 Syncing manifest.json on R2 (${BUCKET_NAME})...`);
  try {
    let allKeys = [];
    let continuationToken = undefined;

    do {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          ContinuationToken: continuationToken,
        })
      );
      if (res.Contents) {
        for (const item of res.Contents) {
          if (item.Key && item.Key.toLowerCase().endsWith('.pdf')) {
            allKeys.push(item.Key);
          }
        }
      }
      continuationToken = res.NextContinuationToken;
    } while (continuationToken);

    allKeys.sort();

    const manifestData = {
      lastUpdated: new Date().toISOString(),
      count: allKeys.length,
      files: allKeys,
    };

    const manifestBuffer = Buffer.from(JSON.stringify(manifestData, null, 2), 'utf-8');

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: 'manifest.json',
        Body: manifestBuffer,
        ContentType: 'application/json',
        CacheControl: 'no-cache, no-store, must-revalidate',
      })
    );

    console.log(`✅ manifest.json updated successfully with ${allKeys.length} PDFs!`);
    console.log(`🔗 Manifest URL: https://notes.obhyash.com/manifest.json`);
    return manifestData;
  } catch (err) {
    console.error(`❌ Failed to sync manifest.json:`, err.message);
  }
}

// CLI argument parsing
const args = process.argv.slice(2);
if (args[0] === 'list') {
  listFiles(args[1] || '');
} else if (args[0] === 'sync') {
  syncManifest();
} else if (args.length >= 2) {
  uploadFile(args[0], args[1]).then(() => syncManifest());
} else {
  console.log(`Usage:`);
  console.log(`  node scripts/upload_note.js <local_pdf_path> <r2_target_path>`);
  console.log(`  node scripts/upload_note.js list [prefix]`);
  console.log(`  node scripts/upload_note.js sync`);
  console.log(`\nExample:`);
  console.log(`  node scripts/upload_note.js ./notes.pdf revision/hsc_physics_1/chapter_2.pdf`);
  console.log(`  node scripts/upload_note.js list revision/`);
  console.log(`  node scripts/upload_note.js sync`);
}

