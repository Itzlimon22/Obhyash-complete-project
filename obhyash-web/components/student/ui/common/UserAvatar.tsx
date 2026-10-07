import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Crown } from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { getRandomAvatar } from '@/lib/avatar-utils';
import { isUserPro } from '@/lib/subscription-utils';
import { getAvatarUrl } from '@/services/storage-service';

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
  priority?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size = 'md',
  className = '',
  showBorder = false,
  isPro: isProProp,
  priority = false,
}) => {
  const [customAvatarError, setCustomAvatarError] = useState(false);
  const [fallbackAvatarError, setFallbackAvatarError] = useState(false);

  const rawAvatarUrl = user?.avatarUrl || (user as any)?.avatar_url;

  // Reset errors whenever user's avatar changes so new avatar is never blocked
  useEffect(() => {
    setCustomAvatarError(false);
    setFallbackAvatarError(false);
  }, [rawAvatarUrl, user?.id]);

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

  const resolvedAvatarUrl = rawAvatarUrl
    ? (rawAvatarUrl.startsWith('http') ? rawAvatarUrl : getAvatarUrl(rawAvatarUrl))
    : null;
  const hasCustomAvatar = !!resolvedAvatarUrl && !customAvatarError;
  const diceBearAvatar = getRandomAvatar(
    user.gender || null,
    user.id || user.name || 'default',
  );
  const hasFallbackAvatar = !fallbackAvatarError;

  const showImage = hasCustomAvatar || (diceBearAvatar && hasFallbackAvatar);
  const currentSrc = hasCustomAvatar ? resolvedAvatarUrl! : diceBearAvatar;

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
          key={currentSrc}
          src={currentSrc}
          alt={user.name || 'User'}
          fill
          priority={priority}
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

  // Clean Pro Member Style: Sleek Subtle Amber Ring + Crisp Crown Badge (Multicolor ring removed)
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full ${className}`}
      title="Pro Member"
    >
      <div className="rounded-full ring-1.5 ring-amber-400 dark:ring-amber-500 shadow-xs">
        {avatarNode}
      </div>
      {/* Crown Pro Badge - Crisp & Proportionate */}
      <span
        className={`absolute -bottom-0.5 -right-0.5 ${getCrownBadgeClasses(size)} rounded-full bg-[#F59E0B] border-[1.5px] border-white dark:border-black flex items-center justify-center shadow-xs select-none pointer-events-none`}
      >
        <Crown size={getCrownIconSize(size)} className="text-black stroke-[2.5]" />
      </span>
    </div>
  );
};

function getCrownBadgeClasses(size: string): string {
  switch (size) {
    case 'xs':
      return 'w-2.5 h-2.5';
    case 'sm':
      return 'w-3.5 h-3.5';
    case 'md':
      return 'w-4 h-4';
    case 'lg':
      return 'w-5 h-5';
    case 'xl':
      return 'w-6 h-6';
    case '2xl':
      return 'w-7 h-7';
    default:
      return 'w-3.5 h-3.5';
  }
}

function getCrownIconSize(size: string): number {
  switch (size) {
    case 'xs':
      return 6;
    case 'sm':
      return 8;
    case 'md':
      return 9;
    case 'lg':
      return 11;
    case 'xl':
      return 13;
    case '2xl':
      return 15;
    default:
      return 8;
  }
}

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
