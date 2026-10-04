import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { generateAdPageHtml } from '../lib/pdf-generator/ad-page';

async function main() {
  const scratchDir = path.join(process.cwd(), 'scratch');
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  const htmlContent = generateAdPageHtml();
  const htmlPath = path.join(scratchDir, 'ad_page_demo.html');
  const pdfPath = path.join(scratchDir, 'ad_page_demo.pdf');

  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
  console.log(`Saved HTML to: ${htmlPath}`);

  const defaultVenv = '/Volumes/LimonSSD/PDF_Question_Extractor/venv/bin/python';
  const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

  const pyCode = `
from playwright.sync_api import sync_playwright
import os

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
    page.wait_for_timeout(1000)
    page.pdf(
        path='${pdfPath}',
        width='210mm',
        height='297mm',
        print_background=True,
        margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'}
    )
    browser.close()
`;

  execSync(`"${defaultVenv}" -c "${pyCode.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  console.log(`Generated PDF at: ${pdfPath}`);

  // Convert PDF to PNG
  const pngPrefix = path.join(scratchDir, 'ad_page_preview');
  execSync(`/opt/homebrew/bin/pdftoppm -png -r 150 "${pdfPath}" "${pngPrefix}"`, { stdio: 'inherit' });
  console.log(`Converted to PNG: ${pngPrefix}-1.png`);
}

main().catch(console.error);
