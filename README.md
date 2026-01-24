# 🚀 Intelligent Bulk Upload System

The Obyash Admin Dashboard now features a high-performance, AI-assisted pipeline for migrating educational content from Excel/JSON to the production database. This system is designed specifically for Engineering and Science content, supporting complex formulas and localized text.

## **App Link :** [text](https://obhyash-app.vercel.app/)

## 🛠 System Architecture

The system operates in four distinct stages to ensure data integrity and academic accuracy:

1. **Intelligent Ingestion**
   - Uses `ExcelJS` to parse a standard 16-column layout.
   - Implements **Levenshtein Fuzzy Matching** to automatically link questions to the correct Subjects and Chapters, preventing duplicate or orphaned entries.

2. **Engineering-Grade Rendering**
   - Fully supports **Bangla text** and **LaTeX** formulas using `react-katex`.
   - The interactive preview table allows admins to verify complex physics and chemistry equations ($E=mc^2$, $\int f(x)dx$, etc.) before deployment.

3. **Gemini AI Review**
   - Integrated **Gemini 1.5 Flash** via Supabase Edge Functions.
   - Acts as an automated "Quality Assurance" layer to fact-check answers and reformat explanations into professional LaTeX strings.

4. **Transactional Deployment**
   - Processes uploads in **batches of 100** to ensure network stability.
   - Includes a **JSON Error Log** export for any rows that fail validation, ensuring no data is lost during the process.

---

## 📋 Technical Stack

| Category          | Technology                                        |
| :---------------- | :------------------------------------------------ |
| **Frontend**      | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| **UI Components** | Shadcn UI, Lucide Icons                           |
| **Math Engine**   | KaTeX (Fast math typesetting)                     |
| **Backend**       | Supabase Edge Functions (Deno)                    |
| **AI Model**      | Google Gemini 1.5 Flash                           |

---

## 📖 How to Use

### 1. File Preparation

Ensure your Excel file follows the 16-column template (Stream, Section, Subject, Chapter, Topic, Question, Option 1-4, Answer, Explanation, Difficulty, Exam Type, Institute, Year).

### 2. Upload & Normalize

Drag and drop your file. The system will perform a fuzzy match against your local `subjects` database. If a match is "fuzzy," you can manually edit it using the built-in **QuestionFormDialog**.

### 3. AI Fact-Check

Click the **AI Review** button. The progress bar will track Gemini's verification of your content. If the AI suggests a correction, the "Answer" and "Explanation" fields will update automatically.

### 4. Deploy

Click **Deploy**. Monitor the terminal-style logs for batch status.

- **Success**: Data is instantly live in Supabase.
- **Partial Failure**: Click **Download Error Log** to get a JSON of failed rows for re-processing.

---

## 🏗 Developer Setup (CLI)

To update the backend logic, ensure the Supabase CLI is installed and run:

```bash
# Deploy the bulk logic
npx supabase functions deploy bulk-upload-questions

# Deploy the AI reviewer
npx supabase functions deploy review-question-ai

# Set your Gemini Key
npx supabase secrets set GEMINI_API_KEY=your_key_here
```
