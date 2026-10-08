const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ufeepgzheopyaefuyegg.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZWVwZ3poZW9weWFlZnV5ZWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE1MDQwNiwiZXhwIjoyMDg0NzI2NDA2fQ.EAj9CxI6y33WbEh63t-eIRHr3PelzX-KHWKl-t8T2ss";

const supabase = createClient(supabaseUrl, serviceRoleKey);

function cleanStrayDollars(text) {
  if (!text || typeof text !== "string") return text;
  let res = text;

  // 1. Fix: $P = $\\begin -> $P = \\begin
  res = res.replace(/(\$\s*[a-zA-Z0-9_\^\-\+\s=\(\)]+?)\s*\$\s*(\\begin\{)/g, "$1 $2");

  // 2. Fix: $ $ -> single space outside math, or empty
  res = res.replace(/\$\s*\$/g, "");

  // 3. Fix double closing dollars: \end{bmatrix}$$ -> \end{bmatrix}$ (unless display math $$...$$)
  res = res.replace(/([^\$])\\end\{([a-zA-Z*]+)\}\$\$(?!\$)/g, "$1\\end{$2}$");

  return res;
}

async function runCleanup() {
  console.log("=== Running targeted stray dollar cleanup on questions ===");

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question, explanation")
    .or("question.ilike.%\\begin{%,question.ilike.%matrix%,explanation.ilike.%\\begin{%,explanation.ilike.%matrix%")
    .limit(1000);

  if (error) {
    console.error("Fetch error:", error);
    process.exit(1);
  }

  let updated = 0;
  for (const q of questions) {
    const newQ = cleanStrayDollars(q.question);
    const newExp = q.explanation ? cleanStrayDollars(q.explanation) : q.explanation;

    const qChanged = newQ !== q.question;
    const expChanged = newExp !== q.explanation;

    if (qChanged || expChanged) {
      const updates = {};
      if (qChanged) updates.question = newQ;
      if (expChanged) updates.explanation = newExp;

      const { error: err } = await supabase
        .from("questions")
        .update(updates)
        .eq("id", q.id);

      if (!err) {
        updated++;
        if (qChanged) {
          console.log(`[CLEANED #${updated}] ID: ${q.id}`);
          console.log("CLEANED Q:", newQ);
        }
      }
    }
  }

  console.log(`Cleanup complete! Updated: ${updated}`);
}

runCleanup();
