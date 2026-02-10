// File: app/api/seed-institutions/route.ts
import { createClient } from '@supabase/supabase-js';
import { createClient as createAuthClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import {
  allInstitutions,
  institutionData,
  unitData,
} from '@/lib/institutions-data';

export async function GET() {
  // 1. VERIFY ADMIN AUTH
  const authClient = await createAuthClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check role
  const { data: profile } = await authClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role?.toLowerCase() !== 'admin') {
    return NextResponse.json(
      { error: 'Forbidden: Admins Only' },
      { status: 403 },
    );
  }

  // ✅ FIX: Use SERVICE_ROLE_KEY to bypass RLS policies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  try {
    // 1. Insert Institutions
    for (const inst of allInstitutions) {
      const { error: instError } = await supabase.from('institutions').upsert({
        id: inst.id,
        title: inst.title,
        short_name: inst.shortName,
        category: inst.category,
      });

      if (instError)
        console.error(`Error inserting ${inst.title}:`, instError.message);
    }

    // 2. Insert Units
    for (const [uniId, data] of Object.entries(institutionData)) {
      for (const unit of data.units) {
        const details = unitData[unit.id];

        const { error: unitError } = await supabase
          .from('institution_units')
          .upsert({
            id: unit.id,
            institution_id: uniId,
            title: unit.name,
            logo_id: details?.logoId || 'default-logo',
            available_years: details?.years || [],
          });

        if (unitError)
          console.error(`Error inserting unit ${unit.id}:`, unitError.message);
      }
    }

    return NextResponse.json({
      message: 'Institutions & Units seeded successfully!',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'An unknown error occurred.' },
      { status: 500 },
    );
  }
}
