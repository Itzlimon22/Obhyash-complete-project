const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://ufeepgzheopyaefuyegg.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZWVwZ3poZW9weWFlZnV5ZWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE1MDQwNiwiZXhwIjoyMDg0NzI2NDA2fQ.EAj9CxI6y33WbEh63t-eIRHr3PelzX-KHWKl-t8T2ss";

const supabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Heals KaTeX math blocks where Bengali prose / conjunctions are trapped inside $...$
 * after a matrix environment, or where matrices are missing closing/opening dollars.
 */
function healKaTeXText(text) {
  if (!text || typeof text !== "string") return text;
  let res = text;

  // 1. Untangle trapped Bengali after \\end{matrix...} before closing $
  // Example: \\end{bmatrix} হয়, তবে A^{-1}$ -> \\end{bmatrix}$ হয়, তবে $A^{-1}$
  res = res.replace(
    /(\\end\{(?:[a-zA-Z*]+matrix|cases|array|align\*?)\})\s*([\u0980-\u09FF\s\,\;\:\।\-\(\)\/\?\!]+?)(?:([a-zA-Z0-9\\\{\}\^\_\+\-\*\/\s\.\(\)\|\=]+))?\$/g,
    (_match, endEnv, bengaliPart, trailingMath) => {
      let b = bengaliPart.trim();
      let m = trailingMath ? trailingMath.trim() : "";
      while (m.startsWith(",") || m.startsWith(":") || m.startsWith(";")) {
        b += m[0] + " ";
        m = m.substring(1).trim();
      }
      let out = endEnv + "$ " + b;
      if (m) {
        out += " $" + m + "$";
      }
      return out;
    }
  );

  // 2. Wrap completely naked matrix environments that lack dollar delimiters
  res = res.replace(
    /(?<!\$)\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array|align\*?)\}([\s\S]*?)\\end\{\1\}(?!\$)/g,
    "$\\begin{$1}$2\\end{$1}$"
  );

  // 3. Fix matrix with open dollar but missing closing dollar right after \\end{...}
  res = res.replace(
    /(\$\s*\\begin\{((?:v|p|b|B|V|small)?matrix|cases|array|align\*?)\}[\s\S]*?\\end\{\2\})(?!\$)/g,
    "$1$"
  );

  // 4. Clean stray $$ inside single $ if already wrapped
  res = res.replace(/\$\s*\$\$/g, "$$");
  res = res.replace(/\$\$\s*\$/g, "$$");

  // 5. Clean clean spacing before Bengali dāri (।)
  res = res.replace(/\$\s*।/g, "$ ।");

  return res;
}

async function runMigration() {
  console.log("=== Starting Database KaTeX Matrix & Trapped Bengali Migration ===");

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question, explanation")
    .or("question.ilike.%\\begin{%,question.ilike.%matrix%,explanation.ilike.%\\begin{%,explanation.ilike.%matrix%")
    .limit(1000);

  if (error) {
    console.error("Fetch error:", error);
    process.exit(1);
  }

  console.log(`Fetched ${questions.length} questions for inspection.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const newQuestion = healKaTeXText(q.question);
    const newExplanation = q.explanation ? healKaTeXText(q.explanation) : q.explanation;

    const questionChanged = newQuestion !== q.question;
    const explanationChanged = newExplanation !== q.explanation;

    if (!questionChanged && !explanationChanged) {
      skippedCount++;
      continue;
    }

    const updates = {};
    if (questionChanged) updates.question = newQuestion;
    if (explanationChanged) updates.explanation = newExplanation;

    const { error: updateErr } = await supabase
      .from("questions")
      .update(updates)
      .eq("id", q.id);

    if (updateErr) {
      console.error(`Failed to update Q ID ${q.id}:`, updateErr.message);
      errorCount++;
    } else {
      updatedCount++;
      if (questionChanged) {
        console.log(`\n[UPDATED Q #${updatedCount}] ID: ${q.id}`);
        console.log("OLD:", q.question);
        console.log("NEW:", newQuestion);
      }
    }
  }

  console.log("\n==========================================");
  console.log(`Migration Complete!`);
  console.log(`Total Inspected : ${questions.length}`);
  console.log(`Total Updated   : ${updatedCount}`);
  console.log(`Unchanged       : ${skippedCount}`);
  console.log(`Errors          : ${errorCount}`);
  console.log("==========================================");
}

runMigration();
