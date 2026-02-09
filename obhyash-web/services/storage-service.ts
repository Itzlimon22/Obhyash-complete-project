import { supabase } from './core';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Uploads a file to the appropriate storage provider (Supabase or R2).
 */
export const uploadFile = async (
  file: File,
  bucket: string, // 'avatars' | 'scripts' | 'questions' | 'resources' etc.
): Promise<UploadResult> => {
  try {
    // A: Supabase Storage for Avatars (Easy RLS integration in future if needed, currently public bucket)
    if (bucket === 'avatars') {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      console.log('✅ Uploaded to Supabase Storage:', publicUrl);

      return {
        url: publicUrl,
        path: filePath,
      };
    }

    // B: Cloudflare R2 for heavy/large assets (Zero egress cost)
    // 1. Request Signed URL from unified R2 API
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
      path: publicUrl,
    };
  } catch (error) {
    console.error(`${bucket} Upload failed:`, error);
    throw error;
  }
};

/**
 * Helper to upload user avatar images to Supabase Storage.
 */
export const uploadAvatar = async (file: File) => {
  return uploadFile(file, 'avatars');
};

/**
 * Helper to upload OMR script images to Cloudflare R2.
 */
export const uploadScriptImage = async (file: File) => {
  return uploadFile(file, 'scripts');
};

/**
 * Helper to upload Question images to Cloudflare R2.
 */
export const uploadQuestionImage = async (file: File) => {
  return uploadFile(file, 'questions');
};

export const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return '/placeholder-avatar.png';
  // If it's already a full URL (e.g. from Google Auth or R2 if we ever mixed up), return it
  if (path.startsWith('http')) return path;

  // Otherwise, construct Supabase URL
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
};
