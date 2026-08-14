const fs = require('fs');
const transcriptPath = '/Users/limon/.gemini/antigravity-ide/brain/7578b66c-9e0b-4324-ad72-9036e87c21e2/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf-8').split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      for (const call of data.tool_calls) {
        if (call.name === 'replace_file_content' || call.name === 'multi_replace_file_content') {
           const target = call.args.TargetFile;
           if (target && target.includes('signup_view.dart')) {
             console.log('--- ' + call.name + ' on ' + target + ' ---');
             const chunks = call.args.ReplacementChunks ? JSON.parse(call.args.ReplacementChunks) : [call.args];
             chunks.forEach(chunk => {
               console.log("REPLACED:\n" + chunk.TargetContent + "\nWITH:\n" + chunk.ReplacementContent + "\n------");
             });
           }
        }
      }
    }
  } catch (e) {
  }
}
