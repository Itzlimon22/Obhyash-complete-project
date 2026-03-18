import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side proxy to the Python OMR grading service.
 *
 * Why a proxy? The OMR_SERVICE_URL env var is server-only (no NEXT_PUBLIC_ prefix),
 * and evaluateOMRScript() is called from 'use client' components that can't access it.
 * This route runs on the server where the env var is available.
 *
 * Expects multipart/form-data with:
 *   - image     : File
 *   - key       : string  e.g. "A,B,C,D"
 *   - questions : string  e.g. "30"
 *   - choices   : "4"
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.formData();

    const omrServiceUrl = process.env.OMR_SERVICE_URL;
    if (!omrServiceUrl) {
      return NextResponse.json(
        { error: 'OMR_SERVICE_URL is not configured on the server.' },
        { status: 500 },
      );
    }

    // Forward every field from the caller to the Python API unchanged.
    const forwardForm = new FormData();
    body.forEach((value, key) => forwardForm.append(key, value));

    const pythonRes = await fetch(`${omrServiceUrl}/grade`, {
      method: 'POST',
      body: forwardForm,
    });

    if (!pythonRes.ok) {
      const text = await pythonRes.text();
      console.error('[OMR Proxy] Python service returned non-OK:', text);
      return NextResponse.json(
        { error: 'OMR service error', details: text },
        { status: pythonRes.status },
      );
    }

    const data = await pythonRes.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[OMR Proxy] Unexpected error:', msg);
    return NextResponse.json(
      { error: 'Failed to reach OMR service', details: msg },
      { status: 502 },
    );
  }
}
