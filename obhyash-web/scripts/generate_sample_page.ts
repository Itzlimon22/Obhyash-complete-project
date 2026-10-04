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
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Read KaTeX CSS
const rawKatexCss = fs.readFileSync(path.join(cwd, 'public/katex/katex.min.css'), 'utf-8');
const fontsDir = path.join(cwd, 'public/katex/fonts');
const absoluteKatexCss = rawKatexCss.replace(/url\(fonts\//g, `url(file://${fontsDir}/`);

export async function generateSample() {
  const { data: exam } = await supabase
    .from('live_exams')
    .select('*')
    .eq('exam_id', 'engineering_live_01')
    .single();

  const { data: rawQuestions } = await supabase
    .from('live_exam_questions')
    .select('*')
    .eq('live_exam_id', exam.id)
    .order('serial', { ascending: true })
    .limit(12); // First 12 questions for a clean 2-page sample

  const questionsList = rawQuestions || [];
  console.log(`Loaded ${questionsList.length} questions for sample test...`);
  const questions: QuestionItem[] = prepareQuestionItems(questionsList);

  const settings: GeneratorSettings = {
    title: exam.title,
    subtitle: 'ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা (Sample Flexible Layout)',
    theme: 'engineering_slate',
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

  let localHtml = rawHtml
    .replace(/<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/katex[^>]*>/, '')
    .replace(/<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/KaTeX[^>]*>/, '')
    .replace('</head>', `<style>\n${absoluteKatexCss}\n</style>\n</head>`)
    .replace(/url\('\/fonts\//g, `url('file://${cwd}/public/fonts/`);

  const outDir = path.join(cwd, 'public/downloads/engineering_live_exams');
  const htmlPath = path.join(outDir, `sample_flexible.html`);
  const pdfPath = path.join(outDir, `sample_flexible.pdf`);

  fs.writeFileSync(htmlPath, localHtml, 'utf-8');

  // Render to PDF using Google Chrome
  const pyCode = `
from playwright.sync_api import sync_playwright
import os

with sync_playwright() as pw:
    browser = pw.chromium.launch(
        executable_path='${chromePath}',
        args=['--allow-file-access-from-files', '--enable-local-file-accesses', '--disable-web-security']
    )
    page = browser.new_page(viewport={'width': 794, 'height': 1122})
    page.goto('file://' + os.path.abspath('${htmlPath}'))
    page.wait_for_function('window.READY === true', timeout=30000)
    page.wait_for_timeout(400)
    page.pdf(
        path='${pdfPath}',
        width='210mm',
        height='297mm',
        print_background=True,
        margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'}
    )
    browser.close()
print("PDF created successfully")
`;

  execSync(`/Volumes/LimonSSD/PDF_Question_Extractor/venv/bin/python -c "${pyCode.replace(/"/g, '\\"')}"`);
  console.log(`✅ Sample PDF ready at: ${pdfPath}`);
}

generateSample().catch(console.error);
