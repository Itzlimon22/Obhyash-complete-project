from playwright.sync_api import sync_playwright
import os

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    page = browser.new_page(viewport={"width": 794, "height": 1122})
    page.goto("file://" + os.path.abspath("public/downloads/engineering_live_exams/engineering_live_01.html"))
    page.wait_for_function("window.READY === true")
    
    data = page.evaluate("""() => {
        const pages = Array.from(document.querySelectorAll("#root .page"));
        return pages.map((p, idx) => {
            const cols = Array.from(p.querySelectorAll(".col"));
            return {
                page: idx + 1,
                cols: cols.map((c, cIdx) => {
                    const cards = Array.from(c.querySelectorAll(".card"));
                    const qNums = cards.map(card => {
                        const el = card.querySelector(".bd, .bd-mini");
                        return el ? el.textContent.trim() : "?";
                    });
                    const rect = c.getBoundingClientRect();
                    return {
                        colIndex: cIdx + 1,
                        cardCount: cards.length,
                        questions: qNums,
                        colHeight: Math.round(rect.height)
                    };
                })
            };
        });
    }""")
    
    for p in data:
        p_num = p['page']
        print(f"Page {p_num}:")
        for c in p['cols']:
            c_idx = c['colIndex']
            cnt = c['cardCount']
            qs = ", ".join(c['questions'])
            h = c['colHeight']
            print(f"  Col {c_idx}: {cnt} cards ({qs}) | Height: {h}px")
            
    browser.close()
