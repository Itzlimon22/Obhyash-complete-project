import json
import re
import os

QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), '../lib/data/public-mock-questions.json')

with open(QUESTIONS_FILE, 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f"Loaded {len(questions)} questions for perfect healing...")

def heal_string(text: str, is_option: bool = False) -> str:
    if not text or not isinstance(text, str):
        return text

    # 1. Newline characters
    text = text.replace('\\\\n', '\n')
    text = re.sub(r'\\n(?!(?:eq|e\b|ot\b|abla\b|eg\b|u\b|atural\b|earrow\b|warrow\b|i\b|ormalsize\b|ull\b|prec\b|succ\b))', '\n', text)

    # 2. Control characters
    text = text.replace('\x08', '\\theta').replace('\x0b', '\\vec').replace('\x0c', '\\frac')

    # 3. Macro cleanups
    text = re.sub(r'(?<![a-zA-Z\\])ightarrow\b', r'\\rightarrow', text)
    text = re.sub(r'(?<![a-zA-Z\\])imes\b', r'\\times', text)
    text = re.sub(r'(?<![a-zA-Z\\])ext\{', r'\\text{', text)
    text = text.replace(r'\1\text{', r'1\text{')
    text = text.replace(r'\xr\rightarrow', r'\xrightarrow')
    text = text.replace(r'\R\rightarrow', r'\implies')

    # 4. Trailing pipe artifacts
    text = re.sub(r'\$\s*\|\s*$', '$', text, flags=re.MULTILINE)
    text = re.sub(r'\$\s*\|\s*', '$ ', text)

    # 5. Over-escaped backslashes
    text = text.replace(r'^\circ', r'^{\circ}')
    text = re.sub(r'\\{2,}(ge|le|neq|times|pm|cdot|circ|theta|alpha|beta|gamma|delta|lambda|mu|pi|omega|Delta|approx)\b', r'\\\1', text)
    text = re.sub(r'\\{2,}%', r'\%', text)

    # 6. Invalid macros inside \text{...}
    text = re.sub(r'\\text\{\s*\\(pi|theta|alpha|beta|gamma|lambda|mu|omega|sigma|Delta|phi)\s*\}', r'\\\1', text)
    text = re.sub(r'\\text\{\s*\\hat\{([a-zA-Z])\}\s*\}', r'\\hat{\1}', text)
    text = re.sub(r'\\text\{\s*\\vec\{([a-zA-Z])\}\s*\}', r'\\vec{\1}', text)
    text = re.sub(r'\\text\{\s*\\mu\s+([A-Za-z]+)\s*\}', r'\\mu\\text{\1}', text)
    text = re.sub(r'\\text\{\s*\\Omega\s*\}', r'\\Omega', text)
    text = re.sub(r'\\text\{\s*\^\{\\circ\}\s*([A-Za-z]*)\s*\}', r'^{\\circ}\\text{\1}', text)
    text = re.sub(r'\\text\{\s*\^\\circ\s*([A-Za-z]*)\s*\}', r'^{\\circ}\\text{\1}', text)
    text = re.sub(r'\\text\{([A-Za-z]+)\^([-\d]+)\}', r'\\text{\1}^{\2}', text)
    text = re.sub(r'\\text\{([A-Za-z]+)\^-\}', r'\\text{\1}^{-}', text)

    # 7. Exponent cleanup
    text = re.sub(r'10\^\{([-\d]+)\}\^(\d+)', r'10^{\1\2}', text)
    text = re.sub(r'\^\{([-\d]+)\}\^(\d+)', r'^{\1\2}', text)

    # 8. Fused Greek & math letters
    text = re.sub(r'\\pimr\^2', r'\\pi m r^2', text)
    text = re.sub(r'\\pimr', r'\\pi m r', text)
    text = re.sub(r'\\pier', r'\\pi r', text)
    text = re.sub(r'\\pir\b', r'\\pi r', text)
    text = re.sub(r'\\pif\b', r'\\pi f', text)
    text = re.sub(r'\\piN\b', r'\\pi N', text)
    text = re.sub(r'\\text\{\\mum\}', r'\\mu\\text{m}', text)
    text = re.sub(r'\\mum\b', r'\\mu\\text{m}', text)
    text = re.sub(r'\\Delta([A-Za-z])\b', r'\\Delta \1', text)
    text = re.sub(r'\b(sin|cos|tan)\\theta\b', r'\\\1\\theta', text)

    # 9. Normalize aligned display blocks to strictly $$...$$
    text = re.sub(r'\$*\\begin\{aligned\}', r'$$\\begin{aligned}', text)
    text = re.sub(r'\\end\{aligned\}\$*', r'\\end{aligned}$$', text)

    # Clean inside aligned blocks
    def clean_aligned(m):
        inner = m.group(1)
        inner = re.sub(r'& \s*\\text\{\s*\\end\{aligned\}', r'\\end{aligned}', inner)
        inner = re.sub(r'\\text\{\s*$', '', inner)
        inner = re.sub(r'\\therefore\s*\\text\{\s*$', '', inner)
        inner = re.sub(r'\\n([a-zA-Z0-9\(\-\+])', r'\n\1', inner)
        inner = re.sub(r'।\s*([a-zA-Z0-9\-\+])', r' \\\\\n  \1', inner)
        return f'$$\\begin{{aligned}}{inner}\\end{{aligned}}$$'

    text = re.sub(r'\$\$\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\$\$', clean_aligned, text)

    # 10. Specific broken formula fixes
    text = re.sub(r'\\frac\{\}\\{\[A\]\} =', r'\\frac{-\\Delta[A]}{\\Delta t} =', text)
    text = re.sub(r'\\frac\{\s*\}\s*\{\s*2I\s*\}', r'\\frac{L^2}{2I}', text)
    text = re.sub(r'E = \\frac\{\s*\n?\s*\}\{2I\}', r'E = \\frac{L^2}{2I}', text)
    text = re.sub(r'4\\pimr\^2\/', r'4\\pi^2 m r / T^2', text)
    text = re.sub(r'm\(\\frac\{4\\pi\^2\}\{\[\\text\{T\}\^\{2\}\]\s*\}\s*\}', r'm\\left(\\frac{4\\pi^2}{T^2}\\right)r', text)
    text = re.sub(r'MH\}\{4\\pi\^2\}\s*=', r'I = \\frac{MH}{4\\pi^2} =', text)
    text = re.sub(r'\\alpha\s*=\s*\\sqrt\{\\frac\{K_b\}\{C\}(?!\})', r'\\alpha = \\sqrt{\\frac{K_b}{C}}', text)
    text = re.sub(r'\\cos\^\{-1\}\\left\(-\\frac\{2\}\{3\}\\end\{right\)', r'\\cos^{-1}\\left(-\\frac{2}{3}\\right)', text)

    # Binomial and draft notes
    text = re.sub(r'\\text\{\s*এর সহগ\s*\}', r'\\text{এর সহগ}', text)
    text = re.sub(r'\\text\{\s*\$\s*এর\s*\$\s*সহগ\s*\}', r'\\text{এর সহগ}', text)
    text = re.sub(r'\\text\{\s*\$এর\s*\$\s*সহগ\s*\}', r'\\text{এর সহগ}', text)
    text = re.sub(r'1\s*\\times\s*\(x\^4\s*\\text\{\s*\$?\s*এর\s*\$?\s*সহগ\}\)', r'1 \\times (x^4\\text{-এর সহগ})', text)
    text = re.sub(r'x\s*\\times\s*\(x\^3\s*\\text\{\s*\$?\s*এর\s*\$?\s*সহগ\}\)', r'x \\times (x^3\\text{-এর সহগ})', text)
    text = re.sub(r'x\^2\s*\\times\s*\(x\^2\s*\\text\{\s*\$?\s*এর\s*\$?\s*সহগ\}\)', r'x^2 \\times (x^2\\text{-এর সহগ})', text)
    text = re.sub(r'3x\^2\s*\\times\s*\(x\^2\s*\\text\{\s*\$?\s*এর\s*\$?\s*সহগ\}\)', r'3x^2 \\times (x^2\\text{-এর সহগ})', text)
    text = re.sub(r'2x\s*\\times\s*\(x\^3\s*\\text\{\s*\$?\s*এর\s*\$?\s*সহগ\}\)', r'2x \\times (x^3\\text{-এর সহগ})', text)
    text = re.sub(r'360\s*\\text\{', r'360', text)
    text = re.sub(r'24\s*\\text\{', r'24', text)
    text = re.sub(r'\\text\{\s*\(\s*\\end\{aligned\}', r'\\end{aligned}', text)
    text = re.sub(r'অসম্ভব\)\}\*\*কক্ষ', r'অসম্ভব) **কক্ষ', text)
    text = re.sub(r'Let me adjust[^\$]*\$', '', text)
    text = re.sub(r'Directrix for[^\$]*\$', '', text)
    text = re.sub(r'Let\'s re-verify[^\$]*\$', '', text)
    text = re.sub(r'Let\'s rewrite[^\$]*\$', '', text)
    text = re.sub(r'Let\'s check[^\$]*\$', '', text)
    text = re.sub(r'\\text\{Wait, let\'s recalculate\}[^\$]*\$', '', text)
    text = re.sub(r'\(আরেকটি মান: যদি লব্ধি[^\)]*\)', '', text)
    text = re.sub(r'\(এখানে একটু সংশোধন:[^\)]*\)', '', text)
    text = re.sub(r'\(ভুল হিসাব\)\s*সঠিক হিসাব:', 'সঠিক হিসাব:', text)

    # 11. Specific Set notation repairs
    text = re.sub(r'A\s*=\s*\\\{x\s*:\s*x\s*\\text\{\s*হলো মৌলিক সংখ্যা[^\}]*\}[\s\S]*?x\s*<\s*10\\\}/?', r'A = \\{x : x \\text{ হলো মৌলিক সংখ্যা এবং } x < 10\\}', text)
    text = re.sub(r'\\\{x\s*:\s*x\s*\\text\{\s*হলো ১০[^\}]*\}[\s\S]*?\\\}/?', r'\\{x : x \\text{ হলো ১০ এর গুণনীয়ক}\\}', text)

    # 12. Fix conjunctions & trapped Bengali
    text = re.sub(r'\$\s+(এবং|বা|ও|হলে|এর)\s+\$', r' \1 ', text)
    text = re.sub(r'\$(এবং|বা|ও|হলে|এর)\$', r' \1 ', text)

    # Un-trap pure Bengali blocks inside $...$
    def untrap_bengali(m):
        inner = m.group(1)
        cleaned = re.sub(r'[\s\d\.\,\:\;\!\?\"\'\(\)\-\_]', '', inner)
        if re.match(r'^[\u0980-\u09FF]+$', cleaned):
            return inner
        return m.group(0)

    text = re.sub(r'\$([^\$\n]+?)\$', untrap_bengali, text)

    # Split $MATH এবং MATH$ (outside \text{})
    def split_conj(m):
        m1 = m.group(1).strip()
        conj = m.group(2).strip()
        m2 = m.group(3).strip()
        # Ensure we are not inside \text{...}
        if r'\text{' in m1 and not m1.endswith('}'):
            return m.group(0)
        has_m1 = bool(re.search(r'[\\^_=+\-*/<>]|[a-zA-Z]', m1))
        has_m2 = bool(re.search(r'[\\^_=+\-*/<>]|[a-zA-Z]', m2))
        if has_m1 and has_m2:
            return f"${m1}$ {conj} ${m2}$"
        elif has_m1 and not has_m2:
            return f"${m1}$ {conj} {m2}"
        elif not has_m1 and has_m2:
            return f"{m1} {conj} ${m2}$"
        return f"{m1} {conj} {m2}"

    text = re.sub(r'\$([^\$\n]+?)\s+(এবং|বা|ও|হলে|এর|থেকে|দ্বারা|হতে)\s+([^\$\n]+?)\$', split_conj, text)

    # 13. Fix Dari inside math
    def fix_dari(m):
        inner = m.group(1)
        if '।' not in inner:
            return m.group(0)
        parts = inner.split('।')
        fixed = []
        for p in parts:
            t = p.strip()
            if not t:
                continue
            has_m = bool(re.search(r'[\\^_=+\-*/<>]|[a-zA-Z]', re.sub(r'\\text\{[^\}]*\}', '', t)))
            has_b = bool(re.search(r'[\u0980-\u09FF]', re.sub(r'\\text\{[^\}]*\}', '', t)))
            if not has_m and has_b:
                fixed.append(t)
            elif has_m and not has_b:
                fixed.append(f"${t}$")
            else:
                fixed.append(f"${t}$")
        return '। '.join(fixed)

    text = re.sub(r'\$([^\$\n]+?)\$', fix_dari, text)

    # 14. Options math wrapper
    if is_option:
        trimmed = text.strip()
        if '$' not in trimmed:
            if re.search(r'\\(?:times|frac|sqrt|mu|Omega|Delta|pi|theta|pm)\b|\b\d+(?:\.\d+)?\s*\\times\s*10\^|\[\\text\{[A-Z]', trimmed):
                m_b = re.match(r'^(.*?)\s*([\u0980-\u09FF]+)$', trimmed)
                if m_b and re.search(r'[\\^_=+\-*/<>]', m_b.group(1)):
                    text = f"${m_b.group(1).strip()}$ {m_b.group(2)}"
                else:
                    text = f"${trimmed}$"

    # 15. Clean isolated $ on empty lines
    text = re.sub(r'\n\s*\$\s*\n', '\n', text)

    # 16. Ensure balanced dollars on inline blocks
    # Mask out display math $$...$$
    display_blocks = []
    def mask_disp(m):
        idx = len(display_blocks)
        display_blocks.append(m.group(0))
        return f"@@DISP_{idx}@@"

    text = re.sub(r'\$\$[\s\S]*?\$\$', mask_disp, text)

    # Now balance single dollars in remainder
    single_dollars = len(re.findall(r'(?<!\\)\$', text))
    if single_dollars % 2 != 0:
        if text.endswith('$'):
            text = text[:-1]
        elif text.startswith('$') and single_dollars == 1:
            text = text[1:]
        else:
            text = text + '$'

    # Restore display math blocks
    for idx, block in enumerate(display_blocks):
        text = text.replace(f"@@DISP_{idx}@@", block)

    return text

for q in questions:
    q['question'] = heal_string(q.get('question', ''), False)
    if 'options' in q and isinstance(q['options'], list):
        q['options'] = [heal_string(opt, True) for opt in q['options']]
    q['explanation'] = heal_string(q.get('explanation', ''), False)

    if 'correctAnswerIndex' in q and q.get('options') and len(q['options']) > q['correctAnswerIndex']:
        q['correctAnswer'] = q['options'][q['correctAnswerIndex']]

with open(QUESTIONS_FILE, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print("Saved healed questions to public-mock-questions.json.")
