'use client';

import React, { ReactNode } from 'react';

export interface AppRefreshIndicatorProps {
  children: ReactNode;
  onRefresh?: () => Promise<void> | void;
  disabled?: boolean;
  displacement?: number;
  threshold?: number;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
}

/**
 * AppRefreshIndicator
 * Pull-to-refresh completely removed from web app to allow natural, uninterrupted upward and downward scrolling.
 */
export const AppRefreshIndicator: React.FC<AppRefreshIndicatorProps> = ({
  children,
  className,
}) => {
  return className ? <div className={className}>{children}</div> : <>{children}</>;
};

export default AppRefreshIndicator;
