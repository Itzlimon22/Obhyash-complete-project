// File: app/api/r2-upload/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

function getR2Domain() {
  const raw =
    process.env.NEXT_PUBLIC_R2_DOMAIN ||
    process.env.R2_PUBLIC_DOMAIN ||
    'pub-6560195307b14ca49f6f183b13bfa841.r2.dev';
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

/**
 * POST /api/r2-upload
 *
 * Two modes:
 *  1. JSON body { fileName, fileType, folder }  → returns presigned PUT URL (legacy)
 *  2. FormData with `file` field (+ optional `folder`)  → proxies upload to R2 and returns publicUrl
 */
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? '';

    // ── Mode 2: direct proxy upload (avoids browser CORS requirement on R2) ──
    if (contentType.startsWith('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file') as File | null;
      const folder = (form.get('folder') as string) || 'uploads';

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 },
        );
      }

      const ext = file.name.split('.').pop() || 'bin';
      const objectKey = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: objectKey,
          ContentType: file.type || 'application/octet-stream',
          ContentLength: buffer.length,
          Body: buffer,
        }),
      );

      const r2Domain = getR2Domain();
      return NextResponse.json({
        publicUrl: `https://${r2Domain}/${objectKey}`,
      });
    }

    // ── Mode 1: return presigned URL (kept for backward-compat) ──
    const { fileName, fileType, folder = 'uploads' } = await request.json();

    const sanitizedFileName = fileName
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');
    const objectKey = `${folder}/${Date.now()}-${randomUUID()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const r2Domain = getR2Domain();

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
    console.error('R2 Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
