
import { GoogleGenAI, Type } from "@google/genai";
import { Question, UserAnswers } from "../types";

// Fallback questions... (keeping existing code abbreviated for brevity, essentially just ensuring the imports and existing function remain)
const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Which hook is used to perform side effects in functional components?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    correctAnswerIndex: 1,
    points: 5,
    explanation: "useEffect is specifically designed to handle side effects like data fetching, subscriptions, or manually changing the DOM in functional components."
  }
];

export const generateExamQuestions = async (topic: string, count: number): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please configure your environment variables with a valid API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a challenging exam with ${count} multiple choice questions about "${topic}". 
      
      Requirements:
      1. Each question must have 4 options, one correct answer.
      2. If the topic involves math, science, or formulas, MUST use LaTeX formatting enclosed in single dollar signs (e.g. $E=mc^2$).
      3. Ensure questions vary in difficulty.
      4. Provide a brief explanation for the correct answer, also using LaTeX if applicable.
      
      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              correctAnswerIndex: { type: Type.INTEGER, description: "Index of the correct option (0-3)" },
              points: { type: Type.INTEGER, description: "Points for this question, usually 2 or 5" },
              explanation: { type: Type.STRING, description: "A sentence explaining the correct answer." }
            },
            required: ["id", "text", "options", "correctAnswerIndex", "points", "explanation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");
    
    let questions: Question[] = JSON.parse(text);
    return questions.map((q, idx) => ({ ...q, id: idx + 1 }));

  } catch (error: any) {
    console.error("Gemini generation failed:", error);
    throw new Error(`Generation failed: ${error.message || "Unknown network error"}`);
  }
};

/**
 * Analyzes an OMR script image using Gemini Vision to determine user answers.
 */
export const evaluateOMRScript = async (base64Image: string, questions: Question[]): Promise<UserAnswers> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key missing");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Clean base64 string if it has headers
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpg|jpeg|webp);base64,/, "");

    // Create a mapping context for the AI
    const questionMap = questions.map(q => `Q${q.id}`).join(", ");

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: "image/png",
                            data: cleanBase64
                        }
                    },
                    {
                        text: `Analyze this educational OMR answer sheet image for grading purposes.
                        This is a standard mock exam evaluation.
                        
                        Task: Detect the marked bubble for each question number.
                        
                        Rules:
                        1. Columns typically represent Question Numbers, Rows represent Options (A, B, C, D) or vice versa depending on layout. Look for patterns.
                        2. If a bubble is visibly darkened or crossed, it is selected.
                        3. If multiple bubbles are darkened for one question, ignore it (invalid).
                        4. Return a RAW JSON object where the key is the Question ID (integer) and the value is the Option Index (0 for A, 1 for B, 2 for C, 3 for D).
                        5. Only include detected answers.
                        6. Do not provide conversational text, only valid JSON.
                        
                        Expected Question IDs to look for: ${questionMap}.`
                    }
                ]
            },
        });

        const text = response.text || "";
        
        // Robust JSON extraction: Find content between the first { and last }
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (!jsonMatch) {
            // Check for refusal
            if (text.includes("I'm sorry") || text.includes("I cannot") || text.includes("unable to")) {
                console.warn("Gemini Refusal:", text);
                throw new Error("AI এই ছবিটি বিশ্লেষণ করতে অস্বীকার করেছে। এটি অস্পষ্ট বা নীতিমালার বিরোধী হতে পারে। (Safety Refusal)");
            }
            throw new Error("AI থেকে সঠিক ফরম্যাটে উত্তর পাওয়া যায়নি।");
        }

        const jsonString = jsonMatch[0];
        const parsedResult = JSON.parse(jsonString);
        
        // Ensure keys are numbers and values are valid indices
        const sanitizedAnswers: UserAnswers = {};
        for (const [key, value] of Object.entries(parsedResult)) {
            const qId = parseInt(key);
            const optIdx = value as number;
            if (!isNaN(qId) && typeof optIdx === 'number' && optIdx >= 0 && optIdx <= 3) {
                sanitizedAnswers[qId] = optIdx;
            }
        }

        return sanitizedAnswers;

    } catch (error: any) {
        console.error("OMR Evaluation failed:", error);
        throw new Error(error.message || "OMR স্ক্রিপ্ট বিশ্লেষণ করা সম্ভব হয়নি। ছবিটি পরিষ্কার কিনা নিশ্চিত করুন।");
    }
}
