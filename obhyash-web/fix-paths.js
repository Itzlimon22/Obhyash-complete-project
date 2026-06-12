const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('usePathname')) {
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]next\/navigation['"];/, (match, p1) => {
      if (!p1.includes('usePathname')) {
        return `import { ${p1}, usePathname } from 'next/navigation';`;
      }
      return match;
    });
    if (!content.includes('next/navigation')) {
        content = "import { usePathname } from 'next/navigation';\n" + content;
    }
  }

  // Insert basePath calculation inside the component
  content = content.replace(/(const router = useRouter\(\);)/, "$1\n  const pathname = usePathname();\n  const basePath = pathname.startsWith('/teacher') ? '/teacher/live-exams' : '/admin/live-exams';");
  
  if (!content.includes('const basePath')) {
      content = content.replace(/(export default function [a-zA-Z0-9_]+\([^)]*\) {)/, "$1\n  const pathname = usePathname();\n  const basePath = pathname.startsWith('/teacher') ? '/teacher/live-exams' : '/admin/live-exams';");
  }

  // Replace hardcoded links
  content = content.replace(/\/admin\/live-exams/g, "${basePath}");
  content = content.replace(/href="\$([^"]+)"/g, "href={`$1`}");
  content = content.replace(/router\.push\("\$([^"]+)"\)/g, "router.push(`$1`)");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${filePath}`);
}

['components/admin/features/live-exams/LiveExamResults.tsx', 'components/admin/features/live-exams/LiveExamDashboard.tsx', 'components/admin/features/live-exams/LiveExamBuilder.tsx'].forEach(fixFile);
