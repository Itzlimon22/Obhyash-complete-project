// Refactored to use Next.js API Route instead of Supabase Edge Function
export interface UploadResult {
  url: string;
  path: string;
}

export const uploadFile = async (
  file: File,
  bucket: 'avatars' | 'scripts' | 'questions',
): Promise<UploadResult> => {
  try {
    // 1. Request Signed URL from Next.js API
    const response = await fetch('/api/r2-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder: bucket,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get upload URL: ${response.statusText}`);
    }

    const { uploadUrl, publicUrl } = await response.json();

    // 2. Upload directly to R2 using the signed URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed with status ${uploadResponse.status}`);
    }

    console.log('✅ Uploaded to R2:', publicUrl);

    return {
      url: publicUrl,
      path: publicUrl, // Using publicUrl as path for simplicity, or extract relative if needed
    };
  } catch (error) {
    console.error('R2 Upload failed:', error);
    throw error;
  }
};
