// File: app/api/r2-upload/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { fileName, fileType, folder = 'uploads' } = await request.json();

    // Create a unique file path
    // Sanitize filename to remove spaces and special chars
    const sanitizedFileName = fileName
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');
    const objectKey = `${folder}/${Date.now()}-${uuidv4()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
    });

    // Generate a secure upload URL valid for 5 minutes
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    const rawDomain =
      process.env.NEXT_PUBLIC_R2_DOMAIN ||
      process.env.R2_PUBLIC_DOMAIN ||
      'pub-6560195307b14ca49f6f183b13bfa841.r2.dev';

    // Strip "http://", "https://" and any trailing slashes to prevent "https://https://"
    const r2Domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');

    if (r2Domain.includes('.r2.cloudflarestorage.com')) {
      console.warn(
        'WARNING: R2 public domain is set to the S3 API endpoint. ' +
          'This will cause 401 Unauthorized errors. Use your pub-*.r2.dev or custom domain instead.',
      );
    }

    return NextResponse.json({
      uploadUrl: signedUrl,
      publicUrl: `https://${r2Domain}/${objectKey}`,
    });
  } catch (error) {
    console.error('R2 Signing Error:', error);
    return NextResponse.json({ error: 'Failed to sign URL' }, { status: 500 });
  }
}
