'use server';

import { r2 } from '@/lib/utils/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

/**
 * Uploads a file to Cloudflare R2 and returns the public URL.
 * * @param formData - Must contain a field named 'file'
 * @param folder - Optional folder prefix (default: 'uploads')
 */
export async function uploadToR2(
  formData: FormData,
  folder: string = 'uploads',
) {
  try {
    const file = formData.get('file') as File;

    if (!file) {
      throw new Error('No file provided');
    }

    // 1. Sanitize Filename: Remove special chars, keep extension
    // Example: "My  Image!.png" -> "my-image.png"
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-') // Replace non-alphanumeric with dash
      .replace(/-+/g, '-'); // Remove duplicate dashes

    // 2. Generate Unique Path
    // Result: "uploads/123e4567-my-image.png"
    const fileName = `${folder}/${randomUUID()}-${sanitizedName}`;

    // 3. Convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // ACL is generally not needed for R2 if the bucket allows public read,
      // but you can uncomment if your specific setup requires it.
      // ACL: 'public-read',
    });

    await r2.send(command);

    // 5. Construct Public URL
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${fileName}`;

    return { success: true, url: publicUrl };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    console.error('R2 Upload Error:', error);
    return { success: false, error: errorMessage };
  }
}
