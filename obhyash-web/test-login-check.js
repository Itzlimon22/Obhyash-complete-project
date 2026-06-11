import fs from 'fs';
const content = fs.readFileSync('app/login/page.tsx', 'utf8');
console.log(content.slice(0, 500));
