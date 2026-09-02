import React, { useState } from 'react';
import Image from 'next/image';
import { UserProfile } from '@/lib/types';
import { getRandomAvatar } from '@/lib/avatar-utils';
import { isUserPro } from '@/lib/subscription-utils';

interface UserAvatarProps {
  user?: (Partial<UserProfile> & {
    is_subscribed?: boolean;
    isPro?: boolean;
    plan?: string;
    is_pro?: boolean;
    subscription_status?: string;
    subscription_expires_at?: string;
  }) | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showBorder?: boolean;
  isPro?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  showBorder = false,
  isPro: isProProp,
}) => {
  const [customAvatarError, setCustomAvatarError] = useState(false);
  const [fallbackAvatarError, setFallbackAvatarError] = useState(false);

  if (!user) {
    return (
      <div
        className={`rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse ${getSizeClasses(size)} ${className}`}
      />
    );
  }

  const isPro = isProProp ?? isUserPro(user);

  const initials = user.name ? user.name.charAt(0).toUpperCase() : '?';

  // Logic:
  // 1. Try custom avatar if it exists and hasn't failed.
  // 2. If it fails or doesn't exist, try the gender-based DiceBear avatar.
  // 3. If that also fails, show initials as the final fallback.

  const hasCustomAvatar = !!user.avatarUrl && !customAvatarError;
  const diceBearAvatar = getRandomAvatar(
    user.gender || null,
    user.id || user.name || 'default',
  );
  const hasFallbackAvatar = !fallbackAvatarError;

  const showImage = hasCustomAvatar || (diceBearAvatar && hasFallbackAvatar);
  const currentSrc = hasCustomAvatar ? user.avatarUrl! : diceBearAvatar;

  const avatarNode = (
    <div
      className={`
        relative flex items-center justify-center shrink-0 rounded-full overflow-hidden
        ${getSizeClasses(size)}
        ${!showImage ? user.avatarColor || 'bg-neutral-500' : 'bg-neutral-100 dark:bg-neutral-800'}
        ${showBorder && !isPro ? 'ring-2 ring-white dark:ring-neutral-800 shadow-sm' : ''}
        ${!isPro ? className : ''}
      `}
    >
      {showImage ? (
        <Image
          src={currentSrc}
          alt={user.name || 'User'}
          fill
          unoptimized={currentSrc.includes('dicebear.com')}
          sizes={getSizesAttribute(size)}
          className="object-cover"
          onError={() => {
            if (hasCustomAvatar) setCustomAvatarError(true);
            else setFallbackAvatarError(true);
          }}
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

  if (!isPro) return avatarNode;

  // Google Pro Style Multi-Color Gradient Ring
  return (
    <div
      className={`relative shrink-0 rounded-full p-[2px] md:p-[2.5px] bg-gradient-to-tr from-[#4285F4] via-[#9B72CB] via-[#D96570] via-[#F4B400] to-[#34A853] shadow-sm ${className}`}
      title="Pro Member"
    >
      <div className="rounded-full bg-white dark:bg-neutral-900 p-[1.5px] flex items-center justify-center">
        {avatarNode}
      </div>
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
