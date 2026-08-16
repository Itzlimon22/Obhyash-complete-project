'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Link as LinkIcon } from 'lucide-react';
import { uploadQuestionImage } from '@/services/storage-service';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  compact?: boolean;
  helperText?: string;
}

export function ImageUploader({
  value,
  onChange,
  label = 'Question Diagram / Image',
  compact = false,
  helperText = 'PNG, JPG, or WebP (Auto-uploaded to Cloudflare R2)',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadQuestionImage(file);
      if (result?.url) {
        onChange(result.url);
      }
    } catch (err) {
      alert(`Image upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent | ClipboardEvent) => {
    const items = (e as React.ClipboardEvent).clipboardData?.items || (e as ClipboardEvent).clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileChange(file);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2" onPaste={handlePaste}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
        />
        {value ? (
          <div className="relative group inline-flex items-center gap-1.5 p-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-lg">
            <img
              src={value}
              alt="Option preview"
              className="w-8 h-8 object-cover rounded"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 text-slate-400 hover:text-red-500 rounded"
              title="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            title="Attach image or Paste (Ctrl+V)"
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Attach Image</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2" onPaste={handlePaste}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </label>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900">
              Paste: Ctrl+V / ⌘+V
            </span>
            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
            >
              <LinkIcon className="w-3 h-3" />
              {showUrlInput ? 'Upload File instead' : 'Enter direct URL'}
            </button>
          </div>
        </div>
      )}

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://.../image.png"
            className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>
      ) : value ? (
        <div className="relative group border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={value}
              alt="Uploaded Diagram"
              className="w-16 h-16 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {value.split('/').pop() || 'Question Image'}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Hosted on Cloudflare R2
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          tabIndex={0}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 outline-none focus:ring-2 focus:ring-emerald-500 ${
            isDragOver
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-slate-50/50 dark:hover:bg-slate-850'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />
          {isUploading ? (
            <div className="flex items-center gap-2 text-emerald-600 font-semibold text-xs py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Uploading screenshot to Cloudflare R2...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Click to upload, Drag & Drop, or <span className="text-emerald-600 font-bold underline">Paste (Ctrl+V / ⌘+V)</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
