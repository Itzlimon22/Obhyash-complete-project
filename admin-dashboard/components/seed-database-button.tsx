'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Database, Loader2 } from 'lucide-react';
import { hscSubjects } from '@/lib/data/hsc';

// Initialize Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default function SeedDatabaseButton() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  const handleSeed = async () => {
    if (
      !confirm(
        'Are you sure? This will upload all HSC subjects to the database.',
      )
    )
      return;

    setLoading(true);
    setStatus('Starting upload...');

    try {
      let subjectCount = 0;
      let chapterCount = 0;
      let topicCount = 0;

      // Loop through all subjects
      for (const subject of hscSubjects) {
        setStatus(`Uploading Subject: ${subject.name}...`);

        // 1. Upsert Subject (Marking it as HSC)
        const { error: sErr } = await supabase.from('subjects').upsert({
          id: subject.id,
          name: subject.name,
          group: subject.group,
          level: 'HSC', // 👈 Tagging this data as HSC
        });
        if (sErr)
          throw new Error(`Subject Error (${subject.name}): ${sErr.message}`);
        subjectCount++;

        // Loop through chapters
        for (const chapter of subject.chapters) {
          // 2. Upsert Chapter
          const { error: cErr } = await supabase.from('chapters').upsert({
            id: chapter.id,
            subject_id: subject.id,
            name: chapter.name,
          });
          if (cErr)
            throw new Error(`Chapter Error (${chapter.name}): ${cErr.message}`);
          chapterCount++;

          // Loop through topics
          if (chapter.topics.length > 0) {
            const topicsPayload = chapter.topics.map((t) => ({
              id: t.id,
              chapter_id: chapter.id,
              name: t.name,
              serial: t.serial,
            }));

            // 3. Upsert Topics (Batch)
            const { error: tErr } = await supabase
              .from('topics')
              .upsert(topicsPayload);
            if (tErr)
              throw new Error(
                `Topic Error in ${chapter.name}: ${tErr.message}`,
              );
            topicCount += chapter.topics.length;
          }
        }
      }

      setStatus(
        `✅ Success! Added ${subjectCount} Subjects, ${chapterCount} Chapters, ${topicCount} Topics.`,
      );
    } catch (err: any) {
      console.error(err);
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border border-dashed rounded-xl bg-slate-50 mt-8 mb-8">
      <h3 className="font-bold text-slate-700 mb-2">Database Tools</h3>
      <div className="flex items-center gap-4">
        <Button
          onClick={handleSeed}
          disabled={loading}
          variant="outline"
          className="border-blue-200 hover:bg-blue-50 text-blue-700"
        >
          {loading ? (
            <Loader2 className="animate-spin mr-2 h-4 w-4" />
          ) : (
            <Database className="mr-2 h-4 w-4" />
          )}
          Seed HSC Data to DB
        </Button>

        {status && (
          <span
            className={`text-sm font-medium ${status.startsWith('✅') ? 'text-emerald-600' : 'text-slate-600'}`}
          >
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
