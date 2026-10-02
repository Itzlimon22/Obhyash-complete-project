import sys, os, json
from playwright.sync_api import sync_playwright

def render_pdf(html_path, output_pdf_path):
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={'width': 794, 'height': 1122})
        page.goto(f'file://{os.path.abspath(html_path)}')
        page.wait_for_function('window.READY === true', timeout=60000)
        page.wait_for_timeout(300)
        page.pdf(
            path=output_pdf_path,
            width='210mm',
            height='297mm',
            print_background=True,
            margin={'top': '0', 'bottom': '0', 'left': '0', 'right': '0'}
        )
        browser.close()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python render_solution_pdf.py <html_path> <output_pdf_path>")
        sys.exit(1)
    render_pdf(sys.argv[1], sys.argv[2])
    print("SUCCESS")
