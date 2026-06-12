const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/:\s*'\$\{basePath\}'/g, ": '/admin/live-exams'");
  content = content.replace(/`\{basePath\}`/g, "basePath");
  content = content.replace(/'\{basePath\}'/g, "basePath");
  content = content.replace(/usePathname \}/, "usePathname}");
  content = content.replace(/import {  useRouter , usePathname } from 'next\/navigation';/, "import { useRouter, usePathname } from 'next/navigation';");
  
  // also fix LiveExamDashboard.tsx where I might have messed up imports
  if (filePath.includes('LiveExamDashboard.tsx')) {
     content = content.replace("import { usePathname } from 'next/navigation';\n\"use client\";", "\"use client\";\nimport { usePathname } from 'next/navigation';");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
}

['components/admin/features/live-exams/LiveExamResults.tsx', 'components/admin/features/live-exams/LiveExamDashboard.tsx', 'components/admin/features/live-exams/LiveExamBuilder.tsx'].forEach(fixFile);
