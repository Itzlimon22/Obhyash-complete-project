// File: components/ui/image-uploader.tsx
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { uploadToR2 } from '@/app/actions/upload';
import Image from 'next/image';

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
  defaultValue?: string;
}

export function ImageUploader({
  onUploadComplete,
  folder = 'misc',
  defaultValue,
}: ImageUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadToR2(formData, folder);

    if (result.success && result.url) {
      setPreview(result.url);
      onUploadComplete(result.url); // Send URL back to parent form
    } else {
      alert('Upload failed: ' + result.error);
    }

    setLoading(false);
  };

  const clearImage = () => {
    setPreview(null);
    onUploadComplete(''); // Clear URL in parent
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/jpg, application/pdf"
      />

      {!preview ? (
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-24 border-dashed border-2 flex flex-col gap-2"
        >
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-6 w-6 text-neutral-400" />
              <span className="text-xs text-neutral-500">
                Click to upload image/PDF
              </span>
            </>
          )}
        </Button>
      ) : (
        <div className="relative w-full h-40 border rounded-lg overflow-hidden group">
          <Image
            src={preview}
            alt="Uploaded preview"
            fill
            className="object-cover"
          />
          <button
            onClick={clearImage}
            type="button"
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
