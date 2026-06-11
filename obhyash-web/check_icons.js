import fs from 'fs';
const content = fs.readFileSync('components/layout/sidebar.tsx', 'utf8');
console.log("File contains /* { ... omr-check ... } */ ?", content.includes("id: 'omr-check'"));
