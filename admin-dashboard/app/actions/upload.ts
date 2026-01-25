// File: app/actions/upload.ts
'use server';

import { r2 } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

/**
 * Uploads a file to Cloudflare R2 and returns the public URL.
 * @param formData Contains the 'file' object
 * @param folder Optional folder name (e.g., 'questions', 'avatars')
 */
export async function uploadToR2(formData: FormData, folder: string = 'uploads') {
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // 1. Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Generate a unique, safe filename
    // Result: questions/123-456-image.png
    const fileName = `${folder}/${randomUUID()}-${file.name.replace(/\s/g, '-')}`;

    // 3. Upload to R2
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // ACL: 'public-read' // Not strictly needed for R2 if bucket is public, but good practice
    }));

    // 4. Return the public URL
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileName}`;
    return { success: true, url: publicUrl };

  } catch (error: any) {
    console.error('R2 Upload Error:', error);
    return { success: false, error: error.message };
  }
}