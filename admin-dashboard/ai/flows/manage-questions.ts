'use server'

// OLD BROKEN CODE (Likely looked like this)
// export async function addQuestionsInBulk(rawQuestions: any[]) {
//    return rawQuestions.map(...)  <-- Error happens here because rawQuestions is an object
// }

// NEW CORRECT CODE
export async function addQuestionsInBulk(params: any) {
  // 1. Check if we received an array directly OR an object
  const rawQuestions = Array.isArray(params) ? params : params.questions;
  
  if (!Array.isArray(rawQuestions)) {
    throw new Error("Invalid input: Expected an array of questions");
  }

  // 2. Now .map() will work perfectly
  const results = await Promise.all(rawQuestions.map(async (q: any) => {
      // ... your existing database insert logic ...
      // ensure you map 'answer' correctly here too if needed
  }));

  return { success: true, count: results.length };
}