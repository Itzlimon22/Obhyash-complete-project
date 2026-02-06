
import { Question, ExamConfig } from "@/lib/types";
import { fetchQuestions as dbFetchQuestions } from "./database";

// This file is kept for backward compatibility with existing imports,
// but it delegates the actual work to the new robust database service.

export const fetchExamQuestions = async (config: ExamConfig): Promise<Question[]> => {
  return await dbFetchQuestions(config);
};

export const saveExamResult = async () => {
    // Deprecated in favor of direct database service usage, keeping for safety
    console.log("Legacy save called");
};
