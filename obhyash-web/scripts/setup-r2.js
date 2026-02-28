const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  PutObjectCommand,
} = require('@aws-sdk/client-s3');
require('dotenv').config({ path: '.env.local' });

// Ensure keys are present
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.error('Missing R2 environment variables in .env.local');
  process.exit(1);
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function emptyBucket() {
  console.log(`🧹 Emptying bucket: ${bucketName}...`);
  try {
    let isTruncated = true;
    let continuationToken = undefined;

    while (isTruncated) {
      const listCmd = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
      });
      const listRes = await r2.send(listCmd);

      if (listRes.Contents && listRes.Contents.length > 0) {
        const objectsToDelete = listRes.Contents.map((obj) => ({
          Key: obj.Key,
        }));

        const deleteCmd = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: objectsToDelete },
        });

        const deleteRes = await r2.send(deleteCmd);
        console.log(
          `Deleted ${deleteRes.Deleted ? deleteRes.Deleted.length : 0} objects.`,
        );
      }

      isTruncated = listRes.IsTruncated;
      continuationToken = listRes.NextContinuationToken;
    }
    console.log('✅ Bucket emptied successfully.');
  } catch (error) {
    console.error('Error emptying bucket:', error);
    throw error;
  }
}

async function createFolders() {
  const folders = [
    'avatars/',
    'scripts/',
    'questions/',
    'reports/',
    'blog/',
    'uploads/',
  ];

  console.log('\n📁 Creating folder structures...');
  for (const folder of folders) {
    try {
      const cmd = new PutObjectCommand({
        Bucket: bucketName,
        Key: folder,
        Body: '', // Empty body for zero-byte object
      });
      await r2.send(cmd);
      console.log(`Created folder: ${folder}`);
    } catch (error) {
      console.error(`Error creating folder ${folder}:`, error);
    }
  }
  console.log('✅ Folders created successfully.');
}

async function main() {
  try {
    await emptyBucket();
    await createFolders();
    console.log('\n✨ Bucket formatting complete!');
  } catch (err) {
    console.error('Deployment failed:', err);
  }
}

main();
