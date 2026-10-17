'use client';

import React from 'react';
import AuthFlow from './figma/AuthFlow';

interface MinimalAuthPageProps {
  defaultMode?: 'login' | 'register';
}

export default function MinimalAuthPage({ defaultMode = 'login' }: MinimalAuthPageProps) {
  return <AuthFlow defaultMode={defaultMode} />;
}
