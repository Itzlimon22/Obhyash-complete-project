const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ufeepgzheopyaefuyegg.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZWVwZ3poZW9weWFlZnV5ZWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE1MDQwNiwiZXhwIjoyMDg0NzI2NDA2fQ.EAj9CxI6y33WbEh63t-eIRHr3PelzX-KHWKl-t8T2ss';

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  console.log('--- EXAM TYPE SURVEY ---');
  // Get all questions
  const { data, error } = await supabase
    .from('questions')
    .select('id, subject, exam_type');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${data.length} questions.`);
  data.forEach((q) => {
    console.log(`[${q.id}] Subject: "${q.subject}" | Type: "${q.exam_type}"`);
  });
})();
