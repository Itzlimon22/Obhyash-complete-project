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
    // A: Upload to Cloudflare R2 for zero egress bandwidth cost
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', bucket);

      const response = await fetch('/api/r2-upload', {
        method: 'POST',
        body: form,
      });

      if (response.ok) {
        const { publicUrl } = await response.json();
        console.log(`✅ Uploaded ${bucket} to Cloudflare R2:`, publicUrl);
        return {
          url: publicUrl,
          path: publicUrl,
        };
      }
    } catch (r2Error) {
      console.warn(`R2 upload failed for ${bucket}, falling back to Supabase Storage:`, r2Error);
    }

    // B: Fallback to Supabase Storage if R2 is unavailable
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: supabaseError } = await supabase.storage
      .from(bucket === 'avatars' ? 'avatars' : 'uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (supabaseError) throw supabaseError;

    const {
      data: { publicUrl },
    } = supabase.storage
      .from(bucket === 'avatars' ? 'avatars' : 'uploads')
      .getPublicUrl(filePath);

    console.log(`✅ Uploaded ${bucket} to Supabase Storage:`, publicUrl);

    return {
      url: publicUrl,
      path: filePath,
    };
  } catch (error) {
    console.error(`${bucket} Upload failed:`, error);
    throw error;
  }
};

/**
 * Helper to upload user avatar images (Cloudflare R2 with Supabase fallback).
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
// ... existing code ...
export const uploadQuestionImage = async (file: File) => {
  return uploadFile(file, 'questions');
};

/**
 * Helper to upload Report images to Cloudflare R2.
 */
export const uploadReportImage = async (file: File) => {
  return uploadFile(file, 'reports');
};

export const getAvatarUrl = (path: string | null | undefined) => {
  if (!path) return '/placeholder-avatar.png';
  // If it's already a full URL (e.g. from Google Auth or R2 if we ever mixed up), return it
  if (path.startsWith('http')) return path;

  // Otherwise, construct Supabase URL
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
};
