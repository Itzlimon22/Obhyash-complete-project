// File: app/api/r2-upload/route.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

// Allowed folders
const ALLOWED_FOLDERS = new Set([
  'avatars',
  'scripts',
  'questions',
  'resources',
  'reports',
  'support',
  'uploads',
]);

// Allowed file extensions
const ALLOWED_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'svg',
  'pdf',
]);

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function getCorsHeaders(origin: string | null) {
  const allowedOrigins = [
    'https://obhyash.com',
    'https://www.obhyash.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  const headerOrigin = origin && allowedOrigins.includes(origin) ? origin : 'https://obhyash.com';

  return {
    'Access-Control-Allow-Origin': headerOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

/**
 * Validates whether the caller is authenticated via server cookie session,
 * Bearer JWT token, or support request context.
 */
async function authenticateCaller(request: Request, folder: string): Promise<boolean> {
  // 1. Support folder exception: allow login support submissions (e.g. users locked out of auth)
  if (folder === 'support') {
    return true;
  }

  // 2. Cookie session (Web app users)
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return true;
  } catch (_) {}

  // 3. Bearer Token (Flutter app / mobile API clients)
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) return true;
    }
  } catch (_) {}

  return false;
}

/**
 * POST /api/r2-upload
 *
 * Two modes:
 *  1. JSON body { fileName, fileType, folder }  → returns presigned PUT URL (legacy)
 *  2. FormData with `file` field (+ optional `folder`)  → proxies upload to R2 and returns publicUrl
 */
export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const contentType = request.headers.get('content-type') ?? '';

    // ── Mode 2: direct proxy upload (FormData) ──
    if (contentType.startsWith('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file') as File | null;
      let folder = (form.get('folder') as string) || 'uploads';

      // Folder validation
      folder = folder.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!ALLOWED_FOLDERS.has(folder)) {
        folder = 'uploads';
      }

      // Authentication check
      const isAuth = await authenticateCaller(request, folder);
      if (!isAuth) {
        return NextResponse.json(
          { error: 'Unauthorized: Please log in to upload files.' },
          { status: 401, headers: corsHeaders },
        );
      }

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400, headers: corsHeaders },
        );
      }

      // File size validation (max 10MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: 'File size exceeds maximum allowed limit (10MB).' },
          { status: 400, headers: corsHeaders },
        );
      }

      // Extension & MIME validation
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json(
          { error: 'File type not allowed. Supported formats: images (JPG, PNG, WebP, GIF, SVG) and PDF.' },
          { status: 400, headers: corsHeaders },
        );
      }

      const fileMime = file.type || 'application/octet-stream';
      if (fileMime !== 'application/octet-stream' && !ALLOWED_MIME_TYPES.has(fileMime)) {
        return NextResponse.json(
          { error: 'Invalid file MIME type.' },
          { status: 400, headers: corsHeaders },
        );
      }

      const objectKey = `${folder}/${Date.now()}-${randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: objectKey,
          ContentType: fileMime,
          ContentLength: buffer.length,
          Body: buffer,
        }),
      );

      const r2Domain = getR2Domain();
      const directUrl = `https://${r2Domain}/${objectKey}`;
      const proxyUrl = `/api/r2-image?key=${encodeURIComponent(objectKey)}`;

      return NextResponse.json(
        {
          publicUrl: directUrl,
          url: directUrl,
          proxyUrl,
          key: objectKey,
        },
        { headers: corsHeaders },
      );
    }

    // ── Mode 1: return presigned URL (JSON body) ──
    const body = await request.json();
    const { fileName, fileType } = body;
    let folder = (body.folder as string) || 'uploads';

    folder = folder.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!ALLOWED_FOLDERS.has(folder)) {
      folder = 'uploads';
    }

    // Authentication check
    const isAuth = await authenticateCaller(request, folder);
    if (!isAuth) {
      return NextResponse.json(
        { error: 'Unauthorized: Please log in to request upload URL.' },
        { status: 401, headers: corsHeaders },
      );
    }

    if (!fileName || typeof fileName !== 'string') {
      return NextResponse.json(
        { error: 'File name is required' },
        { status: 400, headers: corsHeaders },
      );
    }

    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: 'File type not allowed.' },
        { status: 400, headers: corsHeaders },
      );
    }

    if (fileType && !ALLOWED_MIME_TYPES.has(fileType)) {
      return NextResponse.json(
        { error: 'Invalid MIME type.' },
        { status: 400, headers: corsHeaders },
      );
    }

    const sanitizedFileName = fileName
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9.-]/g, '');
    const objectKey = `${folder}/${Date.now()}-${randomUUID()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType || 'application/octet-stream',
    });

    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const r2Domain = getR2Domain();

    return NextResponse.json(
      {
        uploadUrl: signedUrl,
        publicUrl: `https://${r2Domain}/${objectKey}`,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error('R2 Upload Error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500, headers: corsHeaders },
    );
  }
}
