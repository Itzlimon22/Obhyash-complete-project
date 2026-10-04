import * as fs from 'fs';
import * as path from 'path';
import { generateExamPdf as genVarsityPdf } from './generate_varsity_pdf';
import { generateExamPdf as genEnggPdf } from './generate_engineering_pdf';

async function main() {
  console.log('🚀 Starting re-generation of 14 updated exams with SVG diagrams...\n');

  const varsityExams = [
    'varsity_live_01',
    'varsity_live_04',
    'varsity_live_12',
    'varsity_live_21',
    'varsity_weekly_01',
    'varsity_weekly_03',
    'varsity_weekly_07',
  ];

  const enggExams = [
    'engineering_live_06',
    'engineering_live_08',
    'engineering_live_20',
    'engineering_live_22',
    'engineering_weekly_03',
    'engineering_weekly_07',
    'engineering_weekly_08',
  ];

  const varsiOutDir = '/Volumes/LimonSSD/obhyash materials/varsi';
  const enggOutDir = '/Volumes/LimonSSD/obhyash materials/engg';

  console.log('--- 1. Generating Varsity PDFs ---');
  for (const id of varsityExams) {
    console.log(`⏳ Generating ${id}...`);
    const pdfPath = await genVarsityPdf(id, varsiOutDir);
    const htmlPath = pdfPath.replace(/\.pdf$/, '.html');
    if (fs.existsSync(htmlPath)) {
      fs.unlinkSync(htmlPath);
    }
    console.log(`✅ Finished ${id}: ${pdfPath}`);
  }

  console.log('\n--- 2. Generating Engineering PDFs ---');
  for (const id of enggExams) {
    console.log(`⏳ Generating ${id}...`);
    const pdfPath = await genEnggPdf(id, enggOutDir);
    const htmlPath = pdfPath.replace(/\.pdf$/, '.html');
    if (fs.existsSync(htmlPath)) {
      fs.unlinkSync(htmlPath);
    }
    console.log(`✅ Finished ${id}: ${pdfPath}`);
  }

  // Also clean up any lingering files in obhyash-web/public/downloads
  const localDownloads = path.join(process.cwd(), 'public/downloads');
  if (fs.existsSync(localDownloads)) {
    const entries = fs.readdirSync(localDownloads);
    for (const e of entries) {
      if (e !== '.gitkeep') {
        const full = path.join(localDownloads, e);
        if (fs.statSync(full).isDirectory()) {
          fs.rmSync(full, { recursive: true, force: true });
        } else {
          fs.unlinkSync(full);
        }
      }
    }
  }

  console.log('\n🎉 ALL 14 PDFs successfully re-generated with SVG diagrams and synced to SSD!');
}

main().catch(err => {
  console.error('❌ Error during regeneration:', err);
  process.exit(1);
});
