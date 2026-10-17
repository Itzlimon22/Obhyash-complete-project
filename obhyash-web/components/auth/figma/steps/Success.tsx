'use client';

import React from 'react';
import { Heading, PrimaryButton } from '../ui';

export default function Success({
  title,
  sub,
  cta,
  onCta,
}: {
  title: string;
  sub: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#8b1e3f]/20 ring-1 ring-[#8b1e3f]/50">
        <svg
          className="h-10 w-10 text-[#ef4136]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </div>
      <Heading title={title} sub={sub} />
      <PrimaryButton onClick={onCta}>{cta}</PrimaryButton>
    </div>
  );
}
