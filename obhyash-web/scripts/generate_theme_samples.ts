import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { generateTemplateHtml } from '../lib/pdf-generator/template';
import { QuestionItem, GeneratorSettings } from '../lib/pdf-generator/types';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const cwd = process.cwd();
const defaultVenv = '/Volumes/LimonSSD/PDF_Question_Extractor/venv/bin/python';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const artifactDir = '/Users/limon/.gemini/antigravity-ide/brain/25b53c38-c5c3-4198-b6c9-e09b77a5b088';

const rawKatexCss = fs.readFileSync(path.join(cwd, 'public/katex/katex.min.css'), 'utf-8');
const fontsDir = path.join(cwd, 'public/katex/fonts');
const absoluteKatexCss = rawKatexCss.replace(/url\(fonts\//g, `url(file://${fontsDir}/`);

const banglaAns = ['ক', 'খ', 'গ', 'ঘ'];

async function fetchExam(examId: string) {
  const { data: exam } = await supabase.from('live_exams').select('*').eq('exam_id', examId).single();
  const { data: rawQ } = await supabase.from('live_exam_questions').select('*').eq('live_exam_id', exam.id).order('serial').limit(8);
  const qList = rawQ || [];
  const questions: QuestionItem[] = qList.map((q: any) => ({
    n: q.serial,
    q: q.question,
    o: { a: q.options?.[0] || '', b: q.options?.[1] || '', c: q.options?.[2] || '', d: q.options?.[3] || '' },
    A: banglaAns[q.correct_answer_index] || 'ক',
    E: q.explanation ? [q.explanation] : [],
  }));
  return { exam, questions };
}

function writeSampleHtml(questions: QuestionItem[], themeKey: string, outputName: string, title: string, subtitle: string): string {
  const settings: GeneratorSettings = {
    title,
    subtitle,
    theme: themeKey,
    hasHeader: true,
    density: 'balanced',
    balanceColumns: true,
    headerLeftText: 'অ্যাপ ইনস্টল করো',
    headerLeftUrl: 'https://play.google.com/store/apps/details?id=com.obhyash.app',
    headerRightText: title,
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
  const localHtml = rawHtml
    .replace(/<link rel="stylesheet" href="https:\/\/cdn\.jsdelivr\.net\/npm\/katex[^>]*>/, '')
    .replace(/<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/KaTeX[^>]*>/, '')
    .replace('</head>', `<style>\n${absoluteKatexCss}\n</style>\n</head>`)
    .replace(/url\('\/fonts\//g, `url('file://${cwd}/public/fonts/`);

  const sampleHtmlPath = path.join(artifactDir, `${outputName}.html`);
  fs.writeFileSync(sampleHtmlPath, localHtml, 'utf-8');
  return sampleHtmlPath;
}

async function main() {
  console.log('Writing theme HTML files...');

  const { questions: engQuestions } = await fetchExam('engineering_live_03');
  const { questions: vrsQuestions } = await fetchExam('varsity_live_01');

  const configs = [
    // Engineering themes
    {
      q: engQuestions,
      theme: 'engineering',
      name: 'sample_engineering_navy_amber',
      title: 'BUET & Engineering Admission Prep',
      sub: 'ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    },
    {
      q: engQuestions,
      theme: 'engineering_slate',
      name: 'sample_engineering_slate_blue',
      title: 'BUET & Engineering Admission Prep',
      sub: 'ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    },
    {
      q: engQuestions,
      theme: 'engineering_aerospace',
      name: 'sample_engineering_aerospace_crimson',
      title: 'BUET & Engineering Admission Prep',
      sub: 'ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    },
    {
      q: engQuestions,
      theme: 'engineering_cobalt_gold',
      name: 'sample_engineering_cobalt_gold',
      title: 'BUET & Engineering Admission Prep',
      sub: 'ইঞ্জিনিয়ারিং ভর্তি প্রস্তুতি • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    },
    // Varsity themes
    {
      q: vrsQuestions,
      theme: 'varsity',
      name: 'sample_varsity_emerald_gold',
      title: 'Varsity "KA" Unit Admission Prep',
      sub: 'ঢাকা বিশ্ববিদ্যালয় ও ভার্সিটি ‘ক’ ইউনিট • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    },
    {
      q: vrsQuestions,
      theme: 'varsity_oxford_maroon',
      name: 'sample_varsity_oxford_maroon',
      title: 'Varsity "KA" Unit Admission Prep',
      sub: 'ঢাকা বিশ্ববিদ্যালয় ও ভার্সিটি ‘ক’ ইউনিট • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    },
    {
      q: vrsQuestions,
      theme: 'varsity_nordic_pine',
      name: 'sample_varsity_nordic_pine',
      title: 'Varsity "KA" Unit Admission Prep',
      sub: 'ঢাকা বিশ্ববিদ্যালয় ও ভার্সিটি ‘ক’ ইউনিট • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    },
    {
      q: vrsQuestions,
      theme: 'varsity_indigo',
      name: 'sample_varsity_indigo_violet',
      title: 'Varsity "KA" Unit Admission Prep',
      sub: 'ঢাকা বিশ্ববিদ্যালয় ও ভার্সিটি ‘ক’ ইউনিট • MCQ সমাধান ও বিস্তারিত ব্যাখ্যা',
    },
  ];

  const htmlFiles: Array<{ htmlPath: string; pngPath: string; name: string }> = [];

  for (const c of configs) {
    const htmlPath = writeSampleHtml(c.q, c.theme, c.name, c.title, c.sub);
    const pngPath = path.join(artifactDir, `${c.name}.png`);
    htmlFiles.push({ htmlPath, pngPath, name: c.name });
  }

  console.log(`Rendered ${htmlFiles.length} HTML files. Now capturing screenshots with Chrome...`);

  const pyCode = `
from playwright.sync_api import sync_playwright
import json

files = json.loads('''${JSON.stringify(htmlFiles)}''')

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path='${chromePath}', args=['--allow-file-access-from-files', '--enable-local-file-accesses', '--disable-web-security'])
    page = browser.new_page(viewport={'width': 794, 'height': 1122})
    for f in files:
        print(f"Rendering {f['name']}...")
        page.goto('file://' + f['htmlPath'])
        page.wait_for_function('window.READY === true', timeout=30000)
        page.wait_for_timeout(300)
        p1 = page.locator('.page').first
        p1.screenshot(path=f['pngPath'])
        print(f"Saved {f['pngPath']}")
    browser.close()
`;

  execSync(`"${defaultVenv}" -c "${pyCode.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  console.log('All sample screenshots generated successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
