import { NextRequest, NextResponse } from 'next/server';
import { r2 } from '@/lib/utils/r2'; // ✅ Importing from your utils folder
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType } = await request.json();

    // 1. ইউনিক ফাইলের নাম তৈরি (Unique Filename)
    const uniqueFilename = `${uuidv4()}-${filename.replace(/\s+/g, '-')}`;

    if (!process.env.R2_PUBLIC_DOMAIN) {
      console.error('Missing R2_PUBLIC_DOMAIN environment variable');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      );
    }

    // 2. R2 কমান্ড তৈরি
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFilename,
      ContentType: contentType,
    });

    // 3. সাইন করা URL জেনারেট (Valid for 5 minutes)
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    // 4. পাবলিক URL (যা ডাটাবেসে সেভ হবে)
    const publicUrl = `${process.env.R2_PUBLIC_DOMAIN}/${uniqueFilename}`;

    return NextResponse.json({ uploadUrl: signedUrl, publicUrl });
  } catch (error) {
    console.error('R2 Signing Error:', error);
    return NextResponse.json(
      { error: 'Upload url generation failed' },
      { status: 500 },
    );
  }
}
