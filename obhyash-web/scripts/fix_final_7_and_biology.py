import json
import re
import os

QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), '../lib/data/public-mock-questions.json')

with open(QUESTIONS_FILE, 'r', encoding='utf-8') as f:
    questions = json.load(f)

print("Fixing the final 7 KaTeX errors and cleaning trapped Bengali in Biology/General questions...")

for q in questions:
    qid = q.get('id')
    exp = q.get('explanation', '')

    # 1. 61c53205
    if qid == '61c53205-fb78-4d11-87f5-e2cb5a49ed90':
        q['explanation'] = (
            "ঘূর্ণনরত বস্তুর কেন্দ্রমুখী বলের রাশিমালা:\n\n"
            "$$F = m\\omega^2 r = m\\left(\\frac{2\\pi}{T}\\right)^2 r = \\frac{4\\pi^2 m r}{T^2}$$\n\n"
            "অতএব, সঠিক উত্তর অপশন ৩: $\\frac{4\\pi^2 m r}{T^2}$।"
        )
        if isinstance(q.get('options'), list) and len(q['options']) > 2:
            q['options'][2] = "$\\frac{4\\pi^2 m r}{T^2}$"

    # 2. df0e5bca
    elif qid == 'df0e5bca-1726-47b6-9f26-1114f6498a4a':
        q['explanation'] = (
            "আমরা জানি, $1\\text{ Oe} = 80\\text{ A}\\cdot\\text{m}^{-1}$।\n\n"
            "সুতরাং, $0.3\\text{ Oe} = 0.3 \\times 80\\text{ A}\\cdot\\text{m}^{-1} = 24\\text{ A}\\cdot\\text{m}^{-1}$।\n\n"
            "অতএব, সঠিক উত্তর $24\\text{ A}\\cdot\\text{m}^{-1}$।"
        )

    # 3. 22133607
    elif qid == '22133607-4452-4d47-9752-8cee724037c8':
        q['explanation'] = (
            "দোলনকাল ও জড়তার ভ্রামকের সম্পর্ক:\n\n"
            "$$T = 2\\pi \\sqrt{\\frac{I}{MH}}$$\n\n"
            "$$I = \\frac{T^2 MH}{4\\pi^2} = \\frac{(100)(0.56)(32 \\times 10^{-6})}{4 \\times 9.87} \\approx 4.54 \\times 10^{-5}\\text{ kg}\\cdot\\text{m}^2$$\n\n"
            "অতএব, জড়তার ভ্রামক $4.54 \\times 10^{-5}\\text{ kg}\\cdot\\text{m}^2$।"
        )

    # 4. 5e6aeee1
    elif qid == '5e6aeee1-0ec4-4c3c-b710-586584ba5c64':
        q['explanation'] = (
            "অবশিষ্ট অংশ $= \\left(\\frac{1}{2}\\right)^n = \\frac{1}{16} = \\left(\\frac{1}{2}\\right)^4 \\implies n = 4$।\n\n"
            "যেহেতু $n = \\frac{t}{T_{1/2}}$, তাই:\n\n"
            "$$4 = \\frac{4\\text{ ঘণ্টা}}{T_{1/2}} \\implies T_{1/2} = 1\\text{ ঘণ্টা}$$\n\n"
            "অতএব, অর্ধায়ু হলো $1\\text{ ঘণ্টা}$।"
        )

    # 5. 0301d6a7
    elif qid == '0301d6a7-3268-4ef0-b130-52de286aef3a':
        q['explanation'] = exp.replace(r'270 - 360 nm}', r'270 - 360\text{ nm}')

    # 6. de1482e3
    elif qid == 'de1482e3-7c80-4b3a-88c7-4126b0042e31':
        q['explanation'] = (
            "বিক্রিয়ার হারের সমীকরণ:\n\n"
            "$$r = -\\frac{\\Delta[A]}{\\Delta t} = k[A]^n$$\n\n"
            "অতএব, হার ধ্রুবক ও ঘনমাত্রার সম্পর্ক অনুযায়ী সঠিক উত্তর অপশন ২।"
        )

    # 7. 81a76093
    elif qid == '81a76093-d73c-4375-beb6-9e60e6b4fa74':
        q['explanation'] = (
            "অক্ষরগুলোর সম্ভাব্য বিন্যাস সংখ্যা:\n\n"
            "$$4! = 4 \\times 3 \\times 2 \\times 1 = 24$$\n\n"
            "অতএব, সঠিক উত্তর $24$।"
        )

    # Clean trapped Bengali across all fields
    def clean_trapped_bengali(text):
        if not text:
            return text
        # If a block between $...$ has Bengali and no LaTeX commands other than \text
        def replace_block(m):
            inner = m.group(1).strip()
            # If purely Bengali with spaces and punctuation
            clean_b = re.sub(r'[\s\d\.\,\:\;\!\?\"\'\(\)\-\_]', '', inner)
            if re.match(r'^[\u0980-\u09FF]+$', clean_b):
                return inner
            # If block has Bengali words and no math symbols
            if re.search(r'[\u0980-\u09FF]', inner) and not re.search(r'[\\^_=+\-*/<>]', inner):
                return inner
            return m.group(0)

        return re.sub(r'\$([^\$\n]+?)\$', replace_block, text)

    q['question'] = clean_trapped_bengali(q.get('question', ''))
    if 'options' in q and isinstance(q['options'], list):
        q['options'] = [clean_trapped_bengali(opt) for opt in q['options']]
    q['explanation'] = clean_trapped_bengali(q.get('explanation', ''))

    # Update correctAnswer
    if 'correctAnswerIndex' in q and q.get('options') and len(q['options']) > q['correctAnswerIndex']:
        q['correctAnswer'] = q['options'][q['correctAnswerIndex']]

with open(QUESTIONS_FILE, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print("Saved final cleaned questions successfully.")
