'use server';
import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check; must not be served from any cache
  return NextResponse.json(
    { status: 'ok' },
    { status: 200, headers: { 'Cache-Control': 'no-store' } },
  );
}
