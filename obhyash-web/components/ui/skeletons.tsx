'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shimmer skeleton building blocks for consistent loading states.
 *
 * Usage:
 *   <Skeleton className="h-4 w-[200px]" />
 *   <CardSkeleton />
 *   <ListSkeleton rows={5} />
 */

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800',
        className,
      )}
      {...props}
    />
  );
}

/** Skeleton for a card (e.g., exam history card, dashboard stat card) */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-4',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-[140px]" />
        <Skeleton className="h-5 w-[60px] rounded-full" />
      </div>
      <Skeleton className="h-4 w-[200px]" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[80px] rounded-lg" />
        <Skeleton className="h-9 w-[80px] rounded-lg" />
        <Skeleton className="h-9 w-[80px] rounded-lg" />
      </div>
    </div>
  );
}

/** Skeleton for a list of items */
export function ListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 rounded-xl">
          <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[60%]" />
            <Skeleton className="h-3 w-[40%]" />
          </div>
          <Skeleton className="h-6 w-[50px] rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a stats grid (3 cards in a row) */
export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-3"
        >
          <Skeleton className="h-4 w-[80px]" />
          <Skeleton className="h-8 w-[60px]" />
        </div>
      ))}
    </div>
  );
}

/** Full-page skeleton (for initial page loads) */
export function PageSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[120px] rounded-xl" />
      </div>
      {/* Stats */}
      <StatsGridSkeleton />
      {/* Content */}
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}
