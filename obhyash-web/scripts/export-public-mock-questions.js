require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TARGET_SUBJECT_IDS = [
  // HSC
  'hsc_physics_1',
  'hsc_physics_2',
  'hsc_chemistry_1',
  'hsc_chemistry_2',
  'hsc_math_1',
  'hsc_math_2',
  'hsc_biology_1',
  'hsc_biology_2',
  'hsc_ict',
  // SSC
  'ssc_physics',
  'ssc_chemistry',
  'ssc_math',
  'ssc_higher_math',
  'ssc_biology',
  'ssc_ict',
];

const QUESTIONS_PER_CHAPTER = 20;

async function run() {
  console.log('Fetching subjects and chapters...');

  const { data: subjects, error: subErr } = await supabase
    .from('subjects')
    .select('id, name, level')
    .in('id', TARGET_SUBJECT_IDS);

  if (subErr) {
    console.error('Error fetching subjects:', subErr);
    return;
  }

  const { data: chapters, error: chapErr } = await supabase
    .from('chapters')
    .select('id, name, subject_id')
    .in('subject_id', TARGET_SUBJECT_IDS);

  if (chapErr) {
    console.error('Error fetching chapters:', chapErr);
    return;
  }

  console.log(`Found ${subjects.length} subjects and ${chapters.length} chapters.`);

  const exportedQuestions = [];
  const validChapters = [];

  for (let i = 0; i < chapters.length; i++) {
    const chap = chapters[i];
    process.stdout.write(`Fetching questions for chapter [${i + 1}/${chapters.length}]: ${chap.name} (${chap.id})... `);

    const { data: qList, error: qErr } = await supabase
      .from('questions')
      .select('id, question, options, correct_answer_indices, explanation, chapter, chapter_id, subject, subject_id, difficulty')
      .eq('chapter_id', chap.id)
      .not('question', 'is', null)
      .not('options', 'is', null)
      .not('explanation', 'is', null)
      .limit(QUESTIONS_PER_CHAPTER * 2); // fetch buffer

    if (qErr) {
      console.log('ERROR:', qErr.message);
      continue;
    }

    if (!qList || qList.length === 0) {
      console.log('0 found (skipping)');
      continue;
    }

    // Filter valid 4-option questions
    const valid = qList.filter(q => {
      if (!q.question || !q.question.trim()) return false;
      if (!Array.isArray(q.options) || q.options.length !== 4) return false;
      if (!Array.isArray(q.correct_answer_indices) || q.correct_answer_indices.length === 0) return false;
      const idx = q.correct_answer_indices[0];
      return idx >= 0 && idx < 4;
    }).slice(0, QUESTIONS_PER_CHAPTER);

    if (valid.length === 0) {
      console.log('No valid questions');
      continue;
    }

    validChapters.push({
      id: chap.id,
      subjectId: chap.subject_id,
      name: chap.name,
      questionCount: valid.length
    });

    const subObj = subjects.find(s => s.id === chap.subject_id);

    for (const q of valid) {
      const correctIdx = q.correct_answer_indices[0];
      exportedQuestions.push({
        id: q.id,
        question: q.question,
        options: q.options,
        correctAnswer: q.options[correctIdx] || '',
        correctAnswerIndex: correctIdx,
        correctAnswerIndices: q.correct_answer_indices,
        explanation: q.explanation || '',
        chapter: chap.name,
        chapterId: chap.id,
        subject: subObj ? subObj.name : q.subject,
        subjectId: chap.subject_id,
        subjectLabel: subObj ? subObj.name : q.subject,
        type: 'MCQ',
        difficulty: q.difficulty || 'Medium',
        status: 'Approved',
        author: 'system',
        createdAt: new Date().toISOString(),
        version: 1,
        tags: [chap.name]
      });
    }

    console.log(`Saved ${valid.length} questions`);
  }

  console.log(`\n========================================`);
  console.log(`Total questions exported: ${exportedQuestions.length}`);
  console.log(`Across ${validChapters.length} active chapters`);
  console.log(`========================================`);

  // Write questions JSON
  const outputPath = path.join(__dirname, '../lib/data/public-mock-questions.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportedQuestions, null, 2), 'utf8');
  console.log('Wrote questions to:', outputPath);

  // Write metadata JSON (active subjects & chapters)
  const metaPath = path.join(__dirname, '../lib/data/public-mock-meta.json');
  fs.writeFileSync(metaPath, JSON.stringify({ subjects, chapters: validChapters }, null, 2), 'utf8');
  console.log('Wrote metadata to:', metaPath);
}

run().catch(console.error);
