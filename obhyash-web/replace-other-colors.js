const fs = require('fs');
const path = require('path');

const DIRS = ['app', 'components', 'lib', 'services', 'hooks'];
const ROOT = 'd:/Obyash App/obhyash-web';

function replaceColors(filePath) {
  if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;
  const content = fs.readFileSync(filePath, 'utf8');

  let updated = content;

  // Replace "cool" secondary colors with emerald
  updated = updated.replace(/\b(blue|purple|cyan|teal|violet)-/g, 'emerald-');

  // Replace "warm" secondary colors with red
  updated = updated.replace(
    /\b(orange|amber|yellow|lime|fuchsia|pink)-/g,
    'red-',
  );

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Optimized ${filePath}`);
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
console.log('Theme optimization complete.');
