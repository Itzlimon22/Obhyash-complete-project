const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let modifiedFiles = [];

walkDir('d:/Obyash App/obhyash-web/components', function (filePath) {
  if (filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // We only want to process files that have standard centered modals.
    // Standard pattern: fixed inset-0 ... flex items-center justify-center
    // Also skip ReportModal which is already done.
    if (
      !content.includes('fixed inset-0') ||
      filePath.includes('ReportModal.tsx')
    ) {
      return;
    }

    // Replace the container:
    // Regex matches the whole class string of the container.
    // e.g. className="fixed inset-0 z-50 flex items-center justify-center p-4 ..."
    content = content.replace(
      /(className=["'`][^"'`]*?fixed\s+inset-0[^"'`]*?flex[^"'`]*?)items-center([^"'`]*?justify-center[^"'`]*?)p-4([^"'`]*?["'`])/g,
      (match, p1, p2, p3) => {
        // Prevent double replacement
        if (p1.includes('items-end') || p2.includes('items-end')) return match;
        return `${p1}items-end sm:items-center${p2}p-0 sm:p-4${p3}`;
      },
    );

    // Some containers don't have p-4 right after justify-center, handle them:
    content = content.replace(
      /(className=["'`][^"'`]*?fixed\s+inset-0[^"'`]*?flex[^"'`]*?)(\bitems-center\b)([^"'`]*?["'`])/g,
      (match, p1, p2, p3) => {
        if (
          p1.includes('items-end') ||
          p2.includes('items-end') ||
          p3.includes('items-end')
        )
          return match;
        // Make sure we also convert p-4 if it exists anywhere in this container string
        let newP3 = p3.replace(/\bp-4\b/, 'p-0 sm:p-4');
        return `${p1}items-end sm:items-center${newP3}`;
      },
    );

    // Now, let's fix the modal content boxes.
    // They are usually the next div with "bg-white" and "rounded-xl" or "rounded-lg".
    // We want them to have "rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl"
    content = content.replace(
      /(className=["'`][^"'`]*?\bbg-white\b[^"'`]*?)rounded-(xl|lg|2xl|md)([^"'`]*?["'`])/g,
      (match, p1, size, p2) => {
        if (match.includes('rounded-t-')) return match; // skip already processed
        // We add animate-in slide-in-from-bottom-10 for the slide effect
        // We ensure w-full is present so it stretches on mobile.
        let newClasses = `rounded-t-2xl sm:rounded-${size} rounded-b-none sm:rounded-b-${size} animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200`;

        let newText = `${p1}${newClasses}${p2}`;
        if (!newText.includes('w-full')) {
          newText = newText.replace(/(className=["'`])/, '$1w-full ');
        }
        return newText;
      },
    );

    // For components without slide animations that might have transforms:
    content = content.replace(
      /\btransform transition-all scale-100\b/g,
      'transform transition-all duration-300',
    );

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      modifiedFiles.push(filePath);
    }
  }
});

console.log(`Modified ${modifiedFiles.length} files.`);
console.dir(modifiedFiles);
