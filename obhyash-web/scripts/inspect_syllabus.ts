import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const chaptersBySubject: Record<string, Set<string>> = {};
  const topicsBySubjectChapter: Record<string, Record<string, Set<string>>> = {};
  
  const total = 60934;
  const step = 2500;
  for (let i = 0; i < total; i += step) {
    const { data, error } = await supabase
      .from('questions')
      .select('subject, chapter, topic')
      .range(i, Math.min(i + step - 1, total));
      
    if (error) {
      console.error('Error at offset', i, error.message);
      break;
    }
    
    for (const r of data || []) {
      if (!r.subject) continue;
      if (!chaptersBySubject[r.subject]) {
        chaptersBySubject[r.subject] = new Set();
        topicsBySubjectChapter[r.subject] = {};
      }
      const ch = r.chapter || 'NO_CHAPTER';
      chaptersBySubject[r.subject].add(ch);
      
      if (!topicsBySubjectChapter[r.subject][ch]) {
        topicsBySubjectChapter[r.subject][ch] = new Set();
      }
      if (r.topic) {
        topicsBySubjectChapter[r.subject][ch].add(r.topic);
      }
    }
    process.stdout.write(`Processed ${Math.min(i + step, total)}/${total}\r`);
  }
  
  console.log('\n\n========== SYLLABUS IN QUESTIONS TABLE ==========');
  for (const [subj, chs] of Object.entries(chaptersBySubject)) {
    console.log(`\nSUBJECT: [${subj}] (${chs.size} chapters)`);
    for (const ch of chs) {
      const topCount = (topicsBySubjectChapter[subj][ch] || new Set()).size;
      const topList = Array.from(topicsBySubjectChapter[subj][ch] || []);
      console.log(`  Chapter: [${ch}] -> ${topCount} topics`);
      if (topCount <= 10) {
        console.log(`    Topics: ${topList.join(' | ')}`);
      } else {
        console.log(`    Topics (sample 6): ${topList.slice(0, 6).join(' | ')} ... (+${topCount - 6} more)`);
      }
    }
  }
}

main();
