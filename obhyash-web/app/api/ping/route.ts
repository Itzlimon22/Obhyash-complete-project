'use server';
import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check; can be used by keep‑alive ping.
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}
