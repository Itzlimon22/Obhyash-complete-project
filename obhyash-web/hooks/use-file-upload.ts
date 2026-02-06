import { useState } from 'react';
import { toast } from 'sonner';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      // 1. Get Signed URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });

      if (!response.ok) throw new Error('Failed to get upload URL');

      const { uploadUrl, publicUrl } = await response.json();

      // 2. Upload to R2 directly
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Upload to R2 failed');

      return publicUrl;
    } catch (error) {
      console.error(error);
      toast.error('ছবি আপলোড ব্যর্থ হয়েছে'); // Bengali Error Message
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading };
};
