import { NextRequest, NextResponse } from 'next/server';
import { parseQuestionContent } from '@/lib/pdf-generator/parser';
import { generateTemplateHtml } from '@/lib/pdf-generator/template';
import { GeneratorSettings } from '@/lib/pdf-generator/types';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      content,
      settings = {
        title: 'মেডিকেল ভর্তি মডেল টেস্ট ০১',
        subtitle: 'রসায়ন, পদার্থ, জীববিজ্ঞান, ইংরেজি ও সাধারণ জ্ঞান • MCQ সমাধান শীট',
        hasHeader: true,
        headerLeftText: 'অ্যাপ ইনস্টল করো',
        headerLeftUrl: 'https://play.google.com/store/apps/details?id=com.obhyash.app',
        headerRightText: 'মেডিকেল ভর্তি মডেল টেস্ট ০১',
        showHeaderLeftIcon: true,
        footerLeftPrefix: 'আনলিমিটেড এক্সাম দাও',
        footerSiteText: 'www.obhyash.com',
        footerLeftUrl: 'https://www.obhyash.com',
        footerLeftSuffix: 'এ',
        footerPagePrefix: 'পৃষ্ঠা',
        useBanglaDigits: true,
        pageOffset: 0,
      },
      format = 'html',
    } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'প্রশ্নের কনটেন্ট (content) প্রদান করুন।' },
        { status: 400 }
      );
    }

    const parseResult = parseQuestionContent(content);
    if (!parseResult.success || !parseResult.questions.length) {
      return NextResponse.json(
        {
          error: 'প্রশ্ন পার্স করা সম্ভব হয়নি।',
          warnings: parseResult.warnings,
        },
        { status: 422 }
      );
    }

    const html = generateTemplateHtml(parseResult.questions, settings);

    if (format === 'html') {
      return NextResponse.json({
        success: true,
        html,
        questionsCount: parseResult.questions.length,
        warnings: parseResult.warnings,
        detectedType: parseResult.detectedType,
      });
    }

    // Direct PDF generation via headless Chromium (if available)
    const tmpDir = path.join(process.cwd(), 'scratch');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const fileId = `solution_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const htmlFilePath = path.join(tmpDir, `${fileId}.html`);
    const pdfFilePath = path.join(tmpDir, `${fileId}.pdf`);

    // Prepare local HTML with absolute paths
    const cwd = process.cwd();
    const localHtml = html
      .replace(/href="\/katex\//g, `href="${cwd}/public/katex/`)
      .replace(/src="\/katex\//g, `src="${cwd}/public/katex/`)
      .replace(/url\('\/fonts\//g, `url('${cwd}/public/fonts/`);

    fs.writeFileSync(htmlFilePath, localHtml, 'utf-8');

    // Check for Python venv with Playwright
    const defaultVenv = '/Volumes/LimonSSD/PDF_Question_Extractor/venv/bin/python';
    const pythonExec = fs.existsSync(defaultVenv) ? defaultVenv : 'python3';

    const renderScript = path.join(cwd, 'scripts', 'render_solution_pdf.py');

    try {
      const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
      const chromeArg = fs.existsSync(chromePath) ? ` "${chromePath}"` : '';

      await execPromise(
        `"${pythonExec}" -c "
from playwright.sync_api import sync_playwright
import os, sys

with sync_playwright() as pw:
    launch_kwargs = {'args': ['--allow-file-access-from-files']}
    if os.path.exists('${chromePath}'):
        launch_kwargs['executable_path'] = '${chromePath}'
    browser = pw.chromium.launch(**launch_kwargs)
    page = browser.new_page(viewport={'width': 794, 'height': 1122})
    page.goto('file://' + os.path.abspath('${htmlFilePath}'))
    page.wait_for_function('window.READY === true', timeout=60000)
    page.wait_for_timeout(300)
    page.pdf(
        path='${pdfFilePath}',
        width='210mm',
        height='297mm',
        print_background=True,
        margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'}
    )
    browser.close()
"`,
        { timeout: 90000 }
      );

      if (fs.existsSync(pdfFilePath)) {
        const pdfBuffer = fs.readFileSync(pdfFilePath);
        
        // Clean up temp files
        try {
          fs.unlinkSync(htmlFilePath);
          fs.unlinkSync(pdfFilePath);
        } catch {}

        const filename = `${settings.title.replace(/[^a-zA-Z0-9\u0980-\u09FF]/g, '_')}_Solution.pdf`;
        return new NextResponse(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          },
        });
      }
    } catch (renderError) {
      console.error('Headless PDF generation error:', renderError);
    }

    // Fallback: Return HTML with instruction
    return NextResponse.json({
      success: true,
      fallback: true,
      html,
      message: 'সার্ভার রেন্ডার ব্যর্থ হয়েছে, ব্রাউজার প্রিন্ট দিয়ে সেভ করুন।',
      questionsCount: parseResult.questions.length,
      warnings: parseResult.warnings,
    });
  } catch (err: any) {
    console.error('API /api/admin/generate-pdf error:', err);
    return NextResponse.json(
      { error: err.message || 'একটি অপ্রত্যাশিত সমস্যা হয়েছে।' },
      { status: 500 }
    );
  }
}
