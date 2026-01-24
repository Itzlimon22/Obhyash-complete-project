import { Subject } from './types'; // Ensure types.ts is in the same folder

export const subjects: Subject[] = [
  {
    id: '1',
    name: 'রসায়ন ১ম পত্র',
    chapters: [
      { 
        id: 'c1', 
        name: 'ল্যাবরেটরীর নিরাপদ ব্যবহার', 
        topics: [{ id: 't1', name: '1', serial: 1 }] 
      }
    ]
  }
];