// GET /api/r2-image?key=reports/filename.jpg
// Proxies R2 objects through the server so the bucket doesn't need public access enabled.
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'Missing key' }, { status: 400 });
  }

  // Basic path traversal guard
  const normalised = key.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');

  try {
    const obj = await r2.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: normalised,
      }),
    );

    const body = obj.Body;
    if (!body) {
      return NextResponse.json({ error: 'Object not found' }, { status: 404 });
    }

    // Stream the R2 object body directly as a readable stream
    const stream = body.transformToWebStream();
    const contentType = obj.ContentType ?? 'application/octet-stream';

    return new Response(stream as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (err: unknown) {
    const code = (err as { name?: string })?.name;
    if (code === 'NoSuchKey') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    console.error('R2 proxy error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 },
    );
  }
}
