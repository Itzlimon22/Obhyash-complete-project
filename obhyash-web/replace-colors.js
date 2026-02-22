const fs = require('fs');
const path = require('path');

const DIRS = ['app', 'components', 'lib', 'services', 'hooks'];
const ROOT = 'd:/Obyash App/obhyash-web';

function replaceColors(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');

  let updated = content;

  // Replace rose-* with red-*  (e.g. text-rose-500 -> text-red-500)
  updated = updated.replace(/\brose-/g, 'red-');

  // Replace indigo-* with emerald-*
  updated = updated.replace(/\bindigo-/g, 'emerald-');

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else {
      replaceColors(fullPath);
    }
  }
}

DIRS.forEach((dir) => {
  const fullDir = path.join(ROOT, dir);
  if (fs.existsSync(fullDir)) traverseDir(fullDir);
});
console.log('Replacement complete.');
