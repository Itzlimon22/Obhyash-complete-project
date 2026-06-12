require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching exams...");
  const { data: exams, error: examsErr } = await supabase.from('live_exams').select('*').limit(1);
  if (examsErr) {
    console.error("Exams error:", examsErr);
    return;
  }
  if (!exams || exams.length === 0) {
    console.log("No exams found");
    return;
  }
  const examId = exams[0].id;
  console.log("Exam ID:", examId);

  console.log("Fetching exam data...");
  const { data, error } = await supabase
    .from("live_exams")
    .select('*, total_questions:live_exam_questions(count)')
    .eq("id", examId)
    .single();
    
  if (error) console.error("getLiveExam error:", error);
  else console.log("getLiveExam data:", data);

  console.log("Fetching questions data...");
  const { data: qData, error: qError } = await supabase
    .from("live_exam_questions")
    .select('id, serial, points, question_id, questions (*)')
    .eq("live_exam_id", examId)
    .order("serial", { ascending: true });
    
  if (qError) console.error("getLiveExamQuestions error:", qError);
  else console.log("getLiveExamQuestions data:", qData);
}

run();
