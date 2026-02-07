import { GoogleGenAI } from '@google/genai';
import { Question, UserAnswers } from '../lib/types';

// --- Constants ---

// --- Helper Functions ---

/**
 * Cleans the AI response text by removing Markdown code blocks.
 */
const cleanJSON = (text: string): string => {
  return text.replace(/```json\s*|\s*```/g, '').trim();
};

// --- Main Functions ---

export const generateExamQuestions = async (
  topic: string,
  count: number,
): Promise<Question[]> => {
  if (!process.env.API_KEY) {
    console.error('API Key is missing in environment variables.');
    // In production, you might want to return fallback data here instead of throwing
    throw new Error('Configuration Error: API Key is missing.');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // ✅ Updated to latest stable model
      contents: {
        role: 'user',
        parts: [
          {
            text: `Generate a challenging exam with ${count} multiple choice questions about "${topic}". 
      
            Requirements:
            1. Use 'content' for the question text.
            2. Each question must have 4 options.
            3. 'correctAnswer' must be the exact text string of the correct option.
            4. If the topic involves math/science, use LaTeX ($...$).
            5. Provide a 'difficulty' level (Easy, Medium, Hard).
            6. Provide a brief explanation.
            
            Return ONLY raw JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              content: { type: 'string' }, // ✅ Renamed from 'text' to 'content'
              options: {
                type: 'array',
                items: { type: 'string' },
              },
              correctAnswer: {
                type: 'string', // ✅ Now a string value
                description: 'The exact text of the correct option',
              },
              difficulty: {
                type: 'string',
                enum: ['Easy', 'Medium', 'Hard'],
              },
              explanation: {
                type: 'string',
              },
            },
            required: [
              'content',
              'options',
              'correctAnswer',
              'difficulty',
              'explanation',
            ],
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error('Empty response from AI');

    const cleanedText = cleanJSON(text);
    const rawQuestions = JSON.parse(cleanedText);

    // ✅ Map to full Question type with default values for missing metadata
    interface RawQuestion {
      content: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      difficulty?: string;
    }

    return (rawQuestions as RawQuestion[]).map(
      (q: RawQuestion, idx: number): Question => ({
        id: (idx + 1).toString(),
        // ✅ Fix 1: Map 'content' to 'question'
        question: q.content,
        type: 'MCQ',
        options: q.options,
        correctAnswer: q.correctAnswer,
        // ✅ Fix 2: Calculate index dynamically
        correctAnswerIndex: q.options.indexOf(q.correctAnswer),
        correctAnswerIndices: [q.options.indexOf(q.correctAnswer)],
        // ✅ Fix 3: Add required 'points'
        points: 1,
        explanation: q.explanation,
        difficulty: (q.difficulty ||
          'Medium') as import('../lib/types').QuestionDifficulty,
        subject: topic,
        chapter: 'General',
        // ✅ Fix 4: Add required 'topic'
        topic: 'AI Generated',
        status: 'Draft',
        author: 'AI Generator',
        createdAt: new Date().toISOString(),
        version: 1,
        tags: ['ai-generated'],
      }),
    );
  } catch (error: unknown) {
    console.error('Gemini generation failed:', error);
    // return FALLBACK_QUESTIONS; // Uncomment to use fallback on error
    if (error instanceof Error) {
      throw new Error(
        `Generation failed: ${error.message || 'Unknown network error'}`,
      );
    } else {
      throw new Error('Generation failed: Unknown error');
    }
  }
};

/**
 * Analyzes an OMR script image using Gemini Vision to determine user answers.
 */
export const evaluateOMRScript = async (
  base64Image: string,
  questions: Pick<Question, 'id'>[],
): Promise<UserAnswers> => {
  if (!process.env.API_KEY) {
    throw new Error('API Key missing');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Clean base64 string
  const cleanBase64 = base64Image.replace(
    /^data:image\/(png|jpg|jpeg|webp);base64,/,
    '',
  );

  const questionMap = questions.map((q) => `Q${q.id}`).join(', ');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this OMR sheet.
                   Task: Detect marked bubbles.
                   Rules:
                   1. Return JSON: Key = Question ID (integer), Value = Option Index (0=A, 1=B, 2=C, 3=D).
                   2. Ignore invalid/multiple marks.
                   3. Expected IDs: ${questionMap}.`,
          },
        ],
      },
    });

    const text = response.text;
    const jsonMatch = text ? text.match(/\{[\s\S]*\}/) : null;

    if (!jsonMatch) {
      if (text && (text.includes("I'm sorry") || text.includes('I cannot'))) {
        throw new Error('AI refused to analyze this image (Safety).');
      }
      throw new Error('Invalid JSON response from AI.');
    }

    const parsedResult = JSON.parse(jsonMatch[0]);
    const sanitizedAnswers: UserAnswers = {};

    for (const [key, value] of Object.entries(parsedResult)) {
      const qId = parseInt(key);
      const optIdx = value as number;

      if (
        !isNaN(qId) &&
        typeof optIdx === 'number' &&
        optIdx >= 0 &&
        optIdx <= 3
      ) {
        sanitizedAnswers[qId] = optIdx;
      }
    }

    return sanitizedAnswers;
  } catch (error: unknown) {
    console.error('OMR Evaluation failed:', error);
    if (error instanceof Error) {
      throw new Error(
        error.message || 'OMR Analysis Failed. Ensure image is clear.',
      );
    } else {
      throw new Error('OMR Analysis Failed. Ensure image is clear.');
    }
  }
};
