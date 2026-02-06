import { hscSubjects } from './hsc';

// You can combine multiple files here later if needed
export const subjects = [
  ...hscSubjects,
  // ...otherSubjects if you have them
];

///3. The Central Export (Optional but Recommended)
///To make importing easier later (e.g., import { subjects } from '@/lib/data'), you can create an index file.