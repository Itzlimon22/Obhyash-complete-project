import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { generateTemplateHtml, prepareQuestionItems } from '../lib/pdf-generator/template';
import { QuestionItem, GeneratorSettings } from '../lib/pdf-generator/types';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const cwd = process.cwd();
const defaultVenv = '/Volumes/LimonSSD/PDF_Question_Extractor/venv/bin/python';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Read KaTeX CSS and make font URLs absolute file paths
const rawKatexCss = fs.readFileSync(path.join(cwd, 'public/katex/katex.min.css'), 'utf-8');
const fontsDir = path.join(cwd, 'public/katex/fonts');
const absoluteKatexCss = rawKatexCss.replace(/url\(fonts\//g, `url(file://${fontsDir}/`);

export async function generateExamPdf(examId: string, outputDir?: string): Promise<string> {
  const { data: exam, error: examErr } = await supabase
    .from('live_exams')
    .select('*')
    .eq('exam_id', examId)
    .single();

  if (examErr || !exam) {
    throw new Error(`Exam not found for ID: ${examId}`);
  }

  const { data: rawQuestions, error: qErr } = await supabase
    .from('live_exam_questions')
    .select('*')
    .eq('live_exam_id', exam.id)
    .order('serial', { ascending: true });

  if (qErr || !rawQuestions || rawQuestions.length === 0) {
    throw new Error(`No questions found for exam: ${examId}`);
  }

  const questions: QuestionItem[] = prepareQuestionItems(rawQuestions);

  const settings: GeneratorSettings = {
    title: exam.title,
    subtitle: 'ঢাকা বিশ্ববিদ্যালয় ও ভার্সিটি ‘ক’ ইউনিট • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    theme: 'varsity_oxford_maroon', // Oxford Imperial Maroon & Antique Gold
    hasHeader: true,
    density: 'balanced',
    balanceColumns: true,
    headerLeftText: 'অ্যাপ ইনস্টল করো',
    headerLeftUrl: 'https://play.google.com/store/apps/details?id=com.obhyash.app',
    headerRightText: exam.title,
    showHeaderLeftIcon: true,
    footerLeftPrefix: 'আনলিমিটেড এক্সাম দাও',
    footerSiteText: 'www.obhyash.com',
    footerLeftUrl: 'https://www.obhyash.com',
    footerLeftSuffix: 'এ',
    footerPagePrefix: 'পৃষ্ঠা',
    useBanglaDigits: true,
    pageOffset: 0,
  };

  const rawHtml = generateTemplateHtml(questions, settings);

  // Inject fully resolved local KaTeX CSS and Kalpurush font
  let localHtml = rawHtml
    .replace(/<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/katex[^>]*>/, '')
    .replace(/<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/KaTeX[^>]*>/, '')
    .replace('</head>', `<style>\n${absoluteKatexCss}\n</style>\n</head>`)
    .replace(/url\('\/fonts\//g, `url('file://${cwd}/public/fonts/`);

  const outDir = outputDir || path.join(cwd, 'public/downloads/varsity_live_exams');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const safeTitle = (exam.exam_id || examId).toLowerCase();
  const htmlPath = path.join(outDir, `${safeTitle}.html`);
  const pdfPath = path.join(outDir, `${safeTitle}.pdf`);

  fs.writeFileSync(htmlPath, localHtml, 'utf-8');

  // Render to PDF using Playwright with file access allowed
  const pyCode = `
from playwright.sync_api import sync_playwright
import os, sys

with sync_playwright() as pw:
    launch_kwargs = {
        'args': [
            '--allow-file-access-from-files',
            '--enable-local-file-accesses',
            '--disable-web-security'
        ]
    }
    if os.path.exists('${chromePath}'):
        launch_kwargs['executable_path'] = '${chromePath}'
    browser = pw.chromium.launch(**launch_kwargs)
    page = browser.new_page(viewport={'width': 794, 'height': 1122})
    page.goto('file://' + os.path.abspath('${htmlPath}'))
    page.wait_for_function('window.READY === true', timeout=60000)
    page.wait_for_timeout(500)
    page.pdf(
        path='${pdfPath}',
        width='210mm',
        height='297mm',
        print_background=True,
        margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'}
    )
    browser.close()
`;

  execSync(`"${defaultVenv}" -c "${pyCode.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });

  if (fs.existsSync(pdfPath)) {
    console.log(`✅ [${examId}] PDF Generated: ${pdfPath} (${(fs.statSync(pdfPath).size / 1024).toFixed(1)} KB)`);
    return pdfPath;
  } else {
    throw new Error(`PDF generation failed for ${examId}`);
  }
}

async function main() {
  const arg = process.argv[2] || 'all';

  if (arg === 'all') {
    const { data: exams, error } = await supabase
      .from('live_exams')
      .select('exam_id, title')
      .ilike('category', '%varsity%')
      .order('exam_id', { ascending: true });

    if (error || !exams) {
      console.error('Error fetching exams:', error);
      return;
    }

    console.log(`🚀 Generating PDFs for ${exams.length} Varsity Live Exams...`);
    const results: string[] = [];

    for (let i = 0; i < exams.length; i++) {
      const e = exams[i];
      console.log(`[${i + 1}/${exams.length}] Generating for ${e.title} (${e.exam_id})...`);
      try {
        const pdfPath = await generateExamPdf(e.exam_id);
        results.push(pdfPath);
      } catch (err: any) {
        console.error(`❌ Failed for ${e.exam_id}:`, err.message);
      }
    }

    console.log(`\n🎉 Successfully generated ${results.length}/${exams.length} Varsity Exam PDFs!`);
    console.log(`📁 Location: ${path.join(cwd, 'public/downloads/varsity_live_exams')}`);
  } else {
    // Single exam
    const examId = arg.startsWith('varsity_') ? arg : `varsity_live_${arg.padStart(2, '0')}`;
    const pdfPath = await generateExamPdf(examId);
    console.log(`🎉 PDF ready at: ${pdfPath}`);
  }
}

if (process.argv[1] && process.argv[1].endsWith('generate_varsity_pdf.ts')) {
  main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
}
