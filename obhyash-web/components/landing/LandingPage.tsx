'use client';

import React from 'react';
import Landing from './Landing';

interface LandingPageProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
}

export default function LandingPage({ onGetStarted, onLogin }: LandingPageProps) {
  return <Landing onStart={onLogin || onGetStarted || (() => {})} />;
}
