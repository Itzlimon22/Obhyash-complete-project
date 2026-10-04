import os
import re
import json
import urllib.request
from typing import Dict, Any, List

# Load environment variables from .env.local
env_path = os.path.join(os.getcwd(), '.env.local')
env_vars = {}
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, v = line.split('=', 1)
                env_vars[k.strip()] = v.strip().strip("'\"")

SUPABASE_URL = env_vars.get('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_KEY = env_vars.get('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SERVICE_KEY:
    raise ValueError("Supabase URL or Service Key missing from .env.local")

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

def supabase_get(endpoint: str) -> List[Dict[str, Any]]:
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    req = urllib.request.Request(url, headers=HEADERS, method='GET')
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def supabase_patch(table: str, row_id: str, updates: Dict[str, Any]):
    url = f"{SUPABASE_URL}/rest/v1/{table}?id=eq.{row_id}"
    data = json.dumps(updates).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=HEADERS, method='PATCH')
    with urllib.request.urlopen(req) as resp:
        return resp.status

def clean_latex(text: str) -> str:
    if not text:
        return text
    
    # 1. Fix literal \DeltaV, \DeltaI
    text = re.sub(r'\\DeltaV\b', r'\\Delta V', text)
    text = re.sub(r'\\DeltaI\b', r'\\Delta I', text)
    text = re.sub(r'\\DeltaT\b', r'\\Delta T', text)
    text = re.sub(r'\\DeltaP\b', r'\\Delta P', text)

    # 2. Fix \textbf{\sqrt{...}} -> \sqrt{...}
    text = re.sub(r'\\textbf\{(\\sqrt\{[^}]+\})\}', r'\1', text)
    text = re.sub(r'\\textbf\{(\$[^\$]+\$)\}', r'\1', text)

    # 3. Fix literal \n inside string
    text = text.replace('\\n', '\n')

    # 4. Fix bare sin\theta without proper spacing
    text = re.sub(r'\bsin\\theta\b', r'\\sin\\theta', text)

    return text

def main():
    print("🔍 Fetching all live exam questions from Supabase...")
    # Fetch questions in batches
    offset = 0
    batch_size = 1000
    all_questions = []
    
    while True:
        endpoint = f"live_exam_questions?select=id,serial,question,explanation,live_exam_id&order=id.asc&offset={offset}&limit={batch_size}"
        batch = supabase_get(endpoint)
        if not batch:
            break
        all_questions.extend(batch)
        offset += batch_size
        print(f"Fetched {len(all_questions)} questions so far...")
        if len(batch) < batch_size:
            break

    print(f"✅ Total questions fetched: {len(all_questions)}")

    # Specific known fixes for the scanned issues
    SPECIFIC_FIXES = {
        # engineering_live_01 Q33: Fix question LaTeX units
        ("engineering_live_01", 33): {
            "question": "একটি গাড়ির ভর $1000\\text{ kg}$। এটি $20\\text{ ms}^{-1}$ বেগে চলার সময় ব্রেক চেপে $50\\text{ m}$ দূরত্বের মধ্যে থামানো হলো। গাড়িটির ত্বরণ কত এবং ব্রেকিং বল কত?",
            "options": ["$0.2\\text{ ms}^{-2}$", "$0.5\\text{ ms}^{-2}$", "$4.0\\text{ ms}^{-2}$", "$9.8\\text{ ms}^{-2}$"],
            "explanation": "আমরা জানি,\n$$v^2 = u^2 + 2as$$\n$$0 = (20)^2 + 2 \\times a \\times 50$$\n$$100a = -400 \\implies a = -4\\text{ ms}^{-2}$$\n\nব্রেকিং বল,\n$$F = ma = 1000 \\times (-4) = -4000\\text{ N}$$\n\nঅতএব, ত্বরণ $-4\\text{ ms}^{-2}$ এবং ব্রেকিং বল $-4000\\text{ N}$।"
        },
        # engineering_live_02 Q24: Saturated solution
        ("engineering_live_02", 24): {
            "explanation": "$40^\\circ\\text{C}$ তাপমাত্রায় দ্রাব্যতা $55$:\n১৫৫ g সম্পৃক্ত দ্রবণে দ্রব থাকে ৫৫ g এবং দ্রাবক থাকে ১০০ g।\n\n১০০ g সম্পৃক্ত দ্রবণে:\nদ্রব $= \\frac{৫৫ \\times ১০০}{১৫৫} \\approx ৩৫.৪৮\\text{ g}$\nদ্রাবক $= ১০০ - ৩৫.৪৮ = ৬৪.৫২\\text{ g}$\n\n$30^\\circ\\text{C}$ তাপমাত্রায় দ্রাব্যতা $45$:\n১০০ g দ্রাবকে সর্বোচ্চ দ্রব থাকতে পারে ৪৫ g।\nসুতরাং, ৬৪.৫২ g দ্রাবকে দ্রব দ্রবীভূত থাকতে পারে:\n$$= \\frac{৪৫ \\times ৬৪.৫২}{১০০} \\approx ২৯.০৩\\text{ g}$$\n\nকেলাসিত দ্রবের পরিমাণ:\n$$= ৩৫.৪৮ - ২৯.০৩ = ৬.৪৫\\text{ g} \\approx ৬.৫\\text{ g}$$"
        },
        # engineering_live_10 Q22
        ("engineering_live_10", 22): {
            "question": "একটি ধারকের ধারকত্ব $3\\mu\\text{F}$ এবং এতে $15\\mu\\text{J}$ শক্তি সঞ্চিত আছে। ধারকটির দুই প্রান্তের বিভব পার্থক্য কত?",
            "explanation": "ধারকে সঞ্চিত শক্তির সূত্র: $U = \\frac{1}{2}CV^2$\n\nদেওয়া আছে, $C = 3 \\times 10^{-6}\\text{ F}$, $U = 15 \\times 10^{-6}\\text{ J}$\n$$15 \\times 10^{-6} = \\frac{1}{2} \\times (3 \\times 10^{-6}) \\times V^2$$\n$$V^2 = \\frac{15 \\times 10^{-6} \\times 2}{3 \\times 10^{-6}} = 10$$\n$$V = \\sqrt{10}\\text{ V} \\approx 3.16\\text{ V}$$"
        },
        # engineering_live_11 Q29
        ("engineering_live_11", 29): {
            "explanation": "$\\text{O}_2$ এর আণবিক ভর, $M = 32 \\times 10^{-3}\\text{ kg/mol}$\n\n$$C_{rms} = \\sqrt{\\frac{3RT}{M}}$$\n$$= \\sqrt{\\frac{3R \\times 32}{32 \\times 10^{-3}}}$$\n$$= \\sqrt{3 \\times 1000 \\times R} = \\sqrt{3000R}$$"
        },
        # engineering_live_16 Q22
        ("engineering_live_16", 22): {
            "explanation": "চৌম্বক বলের সূত্র: $F = qvB \\sin\\theta$\n\nযেহেতু ইলেকট্রনটি ক্ষেত্র বরাবর প্রবেশ করে, তাই $\\theta = 0^\\circ$ হলে $F = 0$।\nতবে লম্বভাবে প্রবেশ করার ক্ষেত্রে ($\\theta = 90^\\circ$):\n$$F = qvB = (1.6 \\times 10^{-19}) \\times 10^7 \\times 2 = 3.2 \\times 10^{-12}\\text{ N}$$"
        },
        # engineering_live_20 Q34
        ("engineering_live_20", 34): {
            "explanation": "বিক্রিয়াটিতে গ্যাসীয় মৌলের মোল সংখ্যার পরিবর্তন:\n$$\\Delta n = \\text{উৎপাদের মোল} - \\text{বিক্রিয়কের মোল}$$\n$$\\Delta n = 2 - (1 + 3) = 2 - 4 = -2$$\n\nআমরা জানি, $K_p = K_c(RT)^{\\Delta n}$\nঅতএব,\n$$K_p = K_c(RT)^{-2}$$"
        },
        # engineering_live_22 Q34
        ("engineering_live_22", 34): {
            "explanation": "ডায়োডের গতীয় রোধ ($r_d$):\n$$r_d = \\frac{\\Delta V}{\\Delta I}$$\n$$r_d = \\frac{0.4 - 0.3}{(70 - 20) \\times 10^{-3}} = \\frac{0.1}{50 \\times 10^{-3}} = 2\\,\\Omega$$"
        },
        # engineering_live_22 Q38
        ("engineering_live_22", 38): {
            "explanation": "জাংশনের গতীয় রোধ ($r_d$):\n$$r_d = \\frac{\\Delta V}{\\Delta I}$$\n$$r_d = \\frac{2.38 - 2.2}{350 \\times 10^{-3}} = \\frac{0.18}{0.35} \\approx 0.514\\,\\Omega$$"
        },
        # engineering_weekly_06 Q53
        ("engineering_weekly_06", 53): {
            "explanation": "চৌম্বক বলের সূত্র: $F = qvB \\sin\\theta$\n\nক্ষেত্র বরাবর প্রবেশ করলে $\\theta = 0^\\circ$ এবং $F = 0$।\nলম্বভাবে প্রবেশের ক্ষেত্রে:\n$$F = qvB = (1.6 \\times 10^{-19}) \\times 10^7 \\times 2 = 3.2 \\times 10^{-12}\\text{ N}$$"
        },
        # engineering_weekly_08 Q9
        ("engineering_weekly_08", 9): {
            "explanation": "জাংশনের গতীয় রোধ ($r_d$):\n$$r_d = \\frac{\\Delta V}{\\Delta I}$$\n$$r_d = \\frac{2.38 - 2.2}{350 \\times 10^{-3}} = \\frac{0.18}{0.35} \\approx 0.514\\,\\Omega$$"
        },
        # varsity_live_14 Q10
        ("varsity_live_14", 10): {
            "explanation": "**ধাপ ১: AgCl এর আণবিক ভর নির্ণয়**\n$\\text{AgCl}$ এর আণবিক ভর $= 108 + 35.5 = 143.5\\text{ g/mol}$\n\n**ধাপ ২: AgCl থেকে ক্লোরিনের পরিমাণ নির্ণয়**\n$143.5\\text{ g AgCl}$-এ ক্লোরিন থাকে $35.5\\text{ g}$\n$0.475\\text{ g AgCl}$-এ ক্লোরিন থাকে:\n$$= \\frac{35.5}{143.5} \\times 0.475 \\approx 0.1175\\text{ g}$$\n\n**ধাপ ৩: জৈব যৌগে ক্লোরিনের শতকরা হার**\n$$\\text{শতকরা হার} = \\frac{0.1175}{0.186} \\times 100\\% \\approx 63.17\\%$$"
        },
        # varsity_live_20 Q11
        ("varsity_live_20", 11): {
            "explanation": "আমরা জানি,\n$$\\frac{N}{N_A} = \\frac{W}{M}$$\nযেখানে, $N$ = অণুর সংখ্যা, $W$ = প্রদত্ত ভর, $M$ = আণবিক ভর।\n\nযদি সব গ্যাসের ভর ($W$) একই হয়, তবে $N \\propto \\frac{1}{M}$। অর্থাৎ যে গ্যাসের আণবিক ভর সবচেয়ে বেশি, তার অণুর সংখ্যা সবচেয়ে কম হবে।\n\n- $\\text{Cl}_2$: $M = 71\\text{ g/mol}$\n- $\\text{SO}_2$: $M = 64\\text{ g/mol}$\n- $\\text{Ar}$: $M = 40\\text{ g/mol}$\n- $\\text{CO}$: $M = 28\\text{ g/mol}$\n\nযেহেতু $\\text{Cl}_2$-এর আণবিক ভর সবচেয়ে বেশি, তাই এতে অণুর সংখ্যা সবচেয়ে কম।"
        },
        # varsity_weekly_07 Q11
        ("varsity_weekly_07", 11): {
            "explanation": "আমরা জানি,\n$$\\frac{N}{N_A} = \\frac{W}{M}$$\nযেখানে, $N$ = অণুর সংখ্যা, $W$ = প্রদত্ত ভর, $M$ = আণবিক ভর।\n\nযদি সব গ্যাসের ভর ($W$) একই হয়, তবে $N \\propto \\frac{1}{M}$। অর্থাৎ যে গ্যাসের আণবিক ভর সবচেয়ে বেশি, তার অণুর সংখ্যা সবচেয়ে কম হবে।\n\n- $\\text{Cl}_2$: $M = 71\\text{ g/mol}$\n- $\\text{SO}_2$: $M = 64\\text{ g/mol}$\n- $\\text{Ar}$: $M = 40\\text{ g/mol}$\n- $\\text{CO}$: $M = 28\\text{ g/mol}$\n\nযেহেতু $\\text{Cl}_2$-এর আণবিক ভর সবচেয়ে বেশি, তাই এতে অণুর সংখ্যা সবচেয়ে কম।"
        },
        # engineering_live_23 Q13
        ("engineering_live_23", 13): {
            "explanation": "যৌগটির গঠন: $\\text{CH}_2=\\text{CH}-\\text{CH}=\\text{O}$\n\nসংকরায়ন বিশ্লেষণ:\n- প্রান্তীয় $\\text{CH}_2$ কার্বন দ্বিবন্ধনযুক্ত $\\rightarrow \\text{sp}^2$ সংকরিত।\n- মধ্যবর্তী $\\text{CH}$ কার্বন দ্বিবন্ধনযুক্ত $\\rightarrow \\text{sp}^2$ সংকরিত।\n- অ্যালডিহাইড মূলকের ($-\\text{CHO}$) কার্বনিল কার্বন দ্বিবন্ধনযুক্ত $\\rightarrow \\text{sp}^2$ সংকরিত।\n\nএখানে সব কার্বন পরমাণুই $\\text{sp}^2$ সংকরিত। বন্ধন গঠনে $\\text{sp}^2$ সংকর অরবিটাল এবং হাইড্রোজেনের $s$ অরবিটাল অংশগ্রহণ করে।\nঅতএব, যৌগে মূলত ২ ধরনের সংকর অরবিটাল বন্ধন বিদ্যমান।\n\nসঠিক উত্তর: (ক) ২।"
        }
    }

    # Fetch exams mapping
    exams_raw = supabase_get("live_exams?select=id,exam_id")
    exam_map = {e['id']: e['exam_id'] for e in exams_raw}

    updated_count = 0

    for q in all_questions:
        q_id = q['id']
        serial = q['serial']
        exam_id = exam_map.get(q['live_exam_id'])
        
        # Check specific fixes
        key = (exam_id, serial)
        if key in SPECIFIC_FIXES:
            fix_data = SPECIFIC_FIXES[key]
            supabase_patch('live_exam_questions', q_id, fix_data)
            print(f"🔧 Applied specific fix to [{exam_id}] Q{serial}")
            updated_count += 1
            continue

        # General cleanups
        orig_q = q.get('question') or ''
        orig_e = q.get('explanation') or ''
        
        new_q = clean_latex(orig_q)
        new_e = clean_latex(orig_e)

        if new_q != orig_q or new_e != orig_e:
            patch = {}
            if new_q != orig_q:
                patch['question'] = new_q
            if new_e != orig_e:
                patch['explanation'] = new_e
            supabase_patch('live_exam_questions', q_id, patch)
            print(f"🧹 Cleaned LaTeX patterns in [{exam_id}] Q{serial}")
            updated_count += 1

    print(f"\n🎉 Finished! Total questions updated/fixed: {updated_count}")

if __name__ == '__main__':
    main()
