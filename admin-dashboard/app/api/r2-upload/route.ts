// File: app/api/r2-upload/route.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { fileName, fileType } = await request.json();
    
    // Create a unique file path
    const objectKey = `omr-scripts/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: objectKey,
      ContentType: fileType,
    });

    // Generate a secure upload URL valid for 5 minutes
    const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });

    return NextResponse.json({ 
      uploadUrl: signedUrl, 
      publicUrl: `https://YOUR_CUSTOM_DOMAIN_OR_R2_URL/${objectKey}` 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to sign URL" }, { status: 500 });
  }
}