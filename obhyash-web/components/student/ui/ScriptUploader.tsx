import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface ScriptUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (file: File, base64Data: string) => void;
}

const ScriptUploader: React.FC<ScriptUploaderProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = (selectedFile: File) => {
    // Check file size (5MB limit)
    const MAX_SIZE_MB = 5;
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(
        `ফাইলটি অনেক বড়! সর্বোচ্চ অনুমোদিত সাইজ ${MAX_SIZE_MB} মেগাবাইট (MB)।`,
      );
      return;
    }

    // Check file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(selectedFile.type)) {
      alert('শুধুমাত্র JPG বা PNG ফরম্যাটের ছবি আপলোড করুন।');
      return;
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    if (file && previewUrl) {
      onSelect(file, previewUrl);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-neutral-100 dark:border-neutral-800 flex flex-col max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
            OMR স্ক্রিপ্ট আপলোড
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Guidelines Box */}
        <div className="mb-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                clipRule="evenodd"
              />
            </svg>
            নির্ভুল ফলাফলের জন্য নির্দেশনা
          </h4>
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1.5 list-disc pl-4">
            <li>
              ফাইলের আকার অবশ্যই <strong>৫ মেগাবাইটের (5MB)</strong> কম হতে হবে।
            </li>
            <li>
              ফরম্যাট: শুধুমাত্র <strong>JPG</strong> বা <strong>PNG</strong>।
            </li>
            <li>OMR শিটের ছবিটি সোজাভাবে এবং পর্যাপ্ত আলোতে তুলুন।</li>
            <li>ছবির চারদিকের কালো মার্কার (কালো বক্স) যেন দৃশ্যমান থাকে।</li>
            <li>কাগজটি সমতল জায়গায় রেখে ছবি তুলুন, যাতে কোনো ভাঁজ না থাকে।</li>
          </ul>
        </div>

        {/* Drop Zone */}
        <div
          className={`
            flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 transition-all cursor-pointer min-h-[200px] mb-4
            ${
              previewUrl
                ? 'border-indigo-300 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-900/10'
                : 'border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 hover:border-indigo-400 dark:hover:border-indigo-500'
            }
          `}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
          />

          {previewUrl ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-lg group">
              <Image
                src={previewUrl}
                alt="Preview"
                width={400}
                height={250}
                className="object-contain rounded shadow-sm"
                style={{ maxHeight: '250px', width: 'auto', height: 'auto' }}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 mb-2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                <span className="text-sm font-bold">পরিবর্তন করুন</span>
              </div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
                {file?.size ? (file.size / 1024 / 1024).toFixed(2) : 0} MB
              </div>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-7 h-7"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                ছবি নির্বাচন করুন
              </span>
              <span className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
                অথবা ড্র্যাগ করে আনুন
              </span>
              <span className="text-xs text-neutral-400 mt-2">
                Max 5MB (JPG, PNG)
              </span>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            বাতিল
          </button>
          <button
            onClick={handleConfirm}
            disabled={!file}
            className="px-6 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
            আপলোড করুন
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScriptUploader;
