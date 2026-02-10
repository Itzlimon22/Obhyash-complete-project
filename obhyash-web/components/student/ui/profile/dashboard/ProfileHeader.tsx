import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';
import { uploadAvatar } from '@/services/storage-service';
import { updateUserProfile } from '@/services/user-service';
import { toast } from 'sonner';
import UserAvatar from '../../common/UserAvatar';
import { getErrorMessage } from '@/lib/error-utils';

interface ProfileHeaderProps {
  user: UserProfile;
  onEdit: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, onEdit }) => {
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    user.avatarUrl,
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create immediate local preview
    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setIsUploading(true);

    try {
      // Upload to 'avatars' bucket via storage service (handles Supabase or R2)
      const { url } = await uploadAvatar(file);
      console.log('Avatar uploaded to:', url);

      // Call API to update user profile with new `url`
      const result = await updateUserProfile({ ...user, avatarUrl: url });

      if (result.success) {
        toast.success('প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(getErrorMessage(error));
      // Revert preview on error
      setAvatarPreview(user.avatarUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
        {/* Avatar Section */}
        <div className="relative group shrink-0">
          {/* Hidden Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
          />

          <div className="relative">
            <UserAvatar
              user={{ ...user, avatarUrl: avatarPreview }}
              size="2xl"
              showBorder
              className={isUploading ? 'opacity-50' : 'opacity-100'}
            />

            {/* Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20 rounded-full">
                <svg
                  className="animate-spin h-8 w-8 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            )}
          </div>

          {/* Camera Icon Overlay */}
          <button
            onClick={triggerFileInput}
            disabled={isUploading}
            className="absolute bottom-1 right-1 p-2 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full shadow-md border border-neutral-200 dark:border-neutral-700 hover:text-rose-600 dark:hover:text-rose-400 transition-colors z-10"
            title="Change Profile Picture"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
            </svg>
          </button>
        </div>

        {/* User Details */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white flex items-center justify-center md:justify-start gap-2">
              {user.name}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-6 h-6 text-emerald-500"
              >
                <path
                  fillRule="evenodd"
                  d="M8.603 3.799A4.49 4.49 0 0 1 12 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 0 1 3.498 1.307 4.491 4.491 0 0 1 1.307 3.497A4.49 4.49 0 0 1 21.75 12a4.49 4.49 0 0 1-1.549 3.397 4.491 4.491 0 0 1-1.307 3.497 4.491 4.491 0 0 1-3.497 1.307A4.49 4.49 0 0 1 12 21.75a4.49 4.49 0 0 1-3.397-1.549 4.49 4.49 0 0 1-3.498-1.306 4.491 4.491 0 0 1-1.307-3.498A4.49 4.49 0 0 1 2.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 0 1 1.307-3.497 4.49 4.49 0 0 1 3.497-1.307Zm4.45 4.815a.75.75 0 0 0-1.127-.088l-3.333 3.733-.946-.947a.75.75 0 0 0-1.06 1.06l1.5 1.5a.75.75 0 0 0 1.079-.02l3.899-4.225Z"
                  clipRule="evenodd"
                />
              </svg>
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium mt-1">
              {user.institute}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
              <span className="text-xs font-bold text-neutral-500 uppercase">
                Target
              </span>
              <span className="text-sm font-bold text-neutral-800 dark:text-white">
                {user.target || 'Not Set'}
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-800/30 text-amber-700 dark:text-amber-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-bold">{user.level}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button
            onClick={onEdit}
            className="px-5 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-bold text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 transition-colors shadow-sm flex items-center justify-center gap-2"
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
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            এডিট প্রোফাইল
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
