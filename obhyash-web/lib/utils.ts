import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts a direct Cloudflare R2 public URL (pub-*.r2.dev/...) to a
 * server-side proxy URL (/api/r2-image?key=...) so images are served
 * through Next.js without requiring public bucket access on R2.
 * Passes through all other URLs unchanged.
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Already a proxy URL
  if (url.startsWith('/api/r2-image')) return url;
  // Match direct R2 public domain: https://pub-xxx.r2.dev/key or https://custom-domain/key
  const r2Match = url.match(/^https?:\/\/[^/]+\.r2\.dev\/(.+)$/);
  if (r2Match) {
    return `/api/r2-image?key=${encodeURIComponent(r2Match[1])}`;
  }
  return url;
}

// Utility functions for formatting and calculations

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const calculateLevel = (xp: number): string => {
  if (xp >= 5000) return 'Legend';
  if (xp >= 3500) return 'Titan';
  if (xp >= 2000) return 'Warrior';
  if (xp >= 800) return 'Scout';
  return 'Rookie';
};

export const toBengaliNumeral = (num: number | string): string => {
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .split('')
    .map((digit) => {
      const index = englishDigits.indexOf(digit);
      return index !== -1 ? bengaliDigits[index] : digit;
    })
    .join('');
};
