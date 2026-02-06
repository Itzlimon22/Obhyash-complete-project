// File: app/api/seed-universities/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// --- PASTE YOUR DATA INTERFACE & CONSTANT HERE ---
// (I am omitting the full array to save space, but paste the 'universities' array here)
import { universities, type EligibilityCriteria } from '@/lib/university-data'; // 1. Put your data in a separate file to keep this clean

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Or SERVICE_ROLE_KEY if RLS blocks you
  );

  try {
    for (const uni of universities) {
      // 1. Insert University
      const { error: uniError } = await supabase
        .from('universities')
        .upsert({
          id: uni.id,
          name: uni.name,
          logo_id: uni.logoId,
          website: uni.website,
          application_date: uni.applicationDate,
        });

      if (uniError) throw new Error(`Uni Error (${uni.name}): ${uniError.message}`);

      // 2. Insert Units
      for (const [unitName, rawCriteria] of Object.entries(uni.units)) {
        const criteria = rawCriteria as EligibilityCriteria;
        const { error: unitError } = await supabase
          .from('university_units')
          .insert({
            university_id: uni.id,
            unit_name: unitName,
            min_ssc_gpa: criteria.minSSCgpa,
            min_hsc_gpa: criteria.minHSCgpa,
            min_total_gpa: criteria.minTotalGPA,
            allowed_groups: criteria.allowedGroups,
            second_time_allowed: criteria.secondTimeAllowed,
            min_subject_gpa: criteria.minSubjectGPA || {}, // Save as JSON
          });

        if (unitError) console.error(`Unit Error (${unitName}):`, unitError.message);
      }
    }

    return NextResponse.json({ message: "Universities seeded successfully!" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}