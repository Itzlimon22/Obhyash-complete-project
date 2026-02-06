import React, { useState } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';

interface UserAvatarProps {
  user?: UserProfile | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  showBorder = false,
}) => {
  const [error, setError] = useState(false);

  if (!user) {
    return (
      <div
        className={`rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse ${getSizeClasses(size)} ${className}`}
      />
    );
  }

  const initials = user.name ? user.name.charAt(0).toUpperCase() : '?';
  const hasAvatar = user.avatarUrl && !error;

  return (
    <div
      className={`
        relative flex items-center justify-center shrink-0 rounded-full overflow-hidden
        ${getSizeClasses(size)}
        ${!hasAvatar ? user.avatarColor || 'bg-neutral-500' : ''}
        ${showBorder ? 'ring-2 ring-white dark:ring-neutral-800 shadow-sm' : ''}
        ${className}
      `}
    >
      {hasAvatar ? (
        <Image
          src={user.avatarUrl!}
          alt={user.name || 'User'}
          fill
          sizes={getSizesAttribute(size)}
          className="object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span
          className={`${getFontSizeClasses(size)} font-bold text-white select-none`}
        >
          {initials}
        </span>
      )}
    </div>
  );
};

function getSizeClasses(size: string): string {
  switch (size) {
    case 'xs':
      return 'w-6 h-6';
    case 'sm':
      return 'w-8 h-8';
    case 'md':
      return 'w-10 h-10';
    case 'lg':
      return 'w-12 h-12';
    case 'xl':
      return 'w-16 h-16';
    case '2xl':
      return 'w-24 h-24';
    default:
      return 'w-10 h-10';
  }
}

function getFontSizeClasses(size: string): string {
  switch (size) {
    case 'xs':
      return 'text-[10px]';
    case 'sm':
      return 'text-xs';
    case 'md':
      return 'text-sm';
    case 'lg':
      return 'text-base';
    case 'xl':
      return 'text-xl';
    case '2xl':
      return 'text-3xl';
    default:
      return 'text-sm';
  }
}

function getSizesAttribute(size: string): string {
  switch (size) {
    case 'xs':
      return '24px';
    case 'sm':
      return '32px';
    case 'md':
      return '40px';
    case 'lg':
      return '48px';
    case 'xl':
      return '64px';
    case '2xl':
      return '96px';
    default:
      return '40px';
  }
}

export default UserAvatar;
