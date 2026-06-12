const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://ufeepgzheopyaefuyegg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZWVwZ3poZW9weWFlZnV5ZWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTA0MDYsImV4cCI6MjA4NDcyNjQwNn0.39zdLZJDNw0RM2PeY1oM_RxvjtRd1DGqmEVFSqbw9fc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Starting query test...");
  try {
    let query = supabase.from('questions').select('*', { count: 'exact' }).limit(1);
    
    // Test the RPC
    const p1 = query;
    const p2 = supabase.rpc('get_question_status_counts', {
      p_subject: null,
      p_chapter: null,
      p_topic: null,
      p_difficulty: null,
      p_author: null,
      p_search: null,
    });
    
    const start = Date.now();
    const [queryResult, countsResult] = await Promise.all([p1, p2]);
    console.log("Finished in", Date.now() - start, "ms");
    console.log("queryResult error:", queryResult.error);
    console.log("countsResult error:", countsResult.error);
    console.log("countsResult data:", countsResult.data);
  } catch (err) {
    console.error("Error building query:", err);
  }
}
test();
