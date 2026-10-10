import json
import re
import os

QUESTIONS_FILE = os.path.join(os.path.dirname(__file__), '../lib/data/public-mock-questions.json')

with open(QUESTIONS_FILE, 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f"Targeted fixing for the remaining 34 issues...")

for q in questions:
    qid = q.get('id')
    exp = q.get('explanation', '')

    # 1. f91ad95c
    if qid == 'f91ad95c-4ba0-472c-9122-bff709815328':
        q['explanation'] = (
            "সুক্রোজের আর্দ্রবিশ্লেষণ সমীকরণ:\n\n"
            "$$\\text{C}_{12}\\text{H}_{22}\\text{O}_{11} + \\text{H}_2\\text{O} "
            "\\xrightarrow{\\text{ইনভারটেজ}} \\text{C}_6\\text{H}_{12}\\text{O}_6 \\text{ (গ্লুকোজ)} "
            "+ \\text{C}_6\\text{H}_{12}\\text{O}_6 \\text{ (ফ্রুক্টোজ)}$$\n\n"
            "অতএব, এই বিক্রিয়ায় প্রভাবক হিসেবে **ইনভারটেজ** ব্যবহৃত হয়।"
        )

    # 2. cab14e53
    elif qid == 'cab14e53-16a1-4b5a-a425-3cc54fe6f7e5':
        q['explanation'] = (
            "গ্লুকোজ থেকে ইথানল তৈরির বিক্রিয়া:\n\n"
            "$$\\text{C}_6\\text{H}_{12}\\text{O}_6 \\xrightarrow{\\text{জাইমেজ}} "
            "2\\text{C}_2\\text{H}_5\\text{OH} + 2\\text{CO}_2$$\n\n"
            "অতএব, এনজাইমটি হলো **জাইমেজ**।"
        )

    # 3. 70e840f1
    elif qid == '70e840f1-1630-494a-9a0a-d3399ca07a32':
        q['explanation'] = exp.replace(r'= 224 L}', r'= 224\text{ L}')

    # 4. f801e7a7
    elif qid == 'f801e7a7-12b5-41b6-ba35-3d3110b50e7d':
        q['explanation'] = exp.replace(r'= 360 ppm}', r'= 360\text{ ppm}')

    # 5. 9b9498e8
    elif qid == '9b9498e8-607b-4660-91b3-d7b9f7108ec3':
        q['explanation'] = (
            "ম্যাট্রিক্সের বৈশিষ্ট্যমূলক সমীকরণ:\n\n"
            "$$\\det(A - xI) = 0$$\n\n"
            "$$\\begin{vmatrix} 1-x & -2 \\\\ 3 & 4-x \\end{vmatrix} = 0$$\n\n"
            "$$\\begin{aligned}\n"
            "  (1-x)(4-x) + 6 &= 0 \\\\\n"
            "  x^2 - 5x + 4 + 6 &= 0 \\\\\n"
            "  x^2 - 5x + 10 &= 0\n"
            "\\end{aligned}$$\n\n"
            "অতএব, বৈশিষ্ট্যমূলক সমীকরণটি হলো $x^2 - 5x + 10 = 0$।"
        )

    # 6. af474af5
    elif qid == 'af474af5-d5a9-4043-a30b-449c12657415':
        q['explanation'] = (
            "মূলবিন্দু $(0, 0)$ হতে $3x - 4y + 10 = 0$ রেখার লম্ব দূরত্ব:\n\n"
            "$$d = \\frac{|3(0) - 4(0) + 10|}{\\sqrt{3^2 + (-4)^2}} = \\frac{10}{5} = 2$$\n\n"
            "অতএব, লম্ব দূরত্ব হলো $2$ একক।"
        )

    # 7. 243f80fe
    elif qid == '243f80fe-0f29-4e2d-8a2b-346a88b6771f':
        q['explanation'] = (
            "মূলবিন্দু হতে $x + y - c = 0$ রেখার দূরত্ব $\\sqrt{2}$ হলে:\n\n"
            "$$d = \\frac{|-c|}{\\sqrt{1^2 + 1^2}} = \\frac{|c|}{\\sqrt{2}} = \\sqrt{2} \\implies |c| = 2$$\n\n"
            "সুতরাং, $c = \\pm 2$।"
        )

    # 8. 80574db3
    elif qid == '80574db3-f9df-4854-ae7b-7dd7d3863633':
        q['explanation'] = (
            "বৃত্তের কেন্দ্র থেকে স্পর্শকের লম্ব দূরত্ব ব্যাসার্ধের সমান:\n\n"
            "$$d = r$$\n\n"
            "$$\\frac{|3(-3) + 4(-4) + c|}{\\sqrt{3^2 + 4^2}} = 5 \\implies \\frac{|-25 + c|}{5} = 5$$\n\n"
            "$$|-25 + c| = 25 \\implies c = 0 \\text{ বা } c = 50$$\n\n"
            "অতএব, $c = 0$ বা $50$।"
        )

    # 9. 5293a53e
    elif qid == '5293a53e-1d9b-4244-81fa-a6874c2b7763':
        q['explanation'] = (
            "শর্তমতে,\n\n"
            "$$\\frac{^{15}P_{r-1}}{^{16}P_r} = \\frac{3}{4}$$\n\n"
            "$$\\frac{\\frac{15!}{(16-r)!}}{\\frac{16!}{(16-r)!}} = \\frac{15!}{16!} = \\frac{1}{16}$$\n\n"
            "সমীকরণ সমাধান করে পাওয়া যায় $r = 4$।"
        )

    # 10. 81a76093
    elif qid == '81a76093-d73c-4375-beb6-9e60e6b4fa74':
        q['explanation'] = exp.replace('24 \\text{\n}', '24').replace('24 \\text{}', '24')

    # 11. 2d76f2c3
    elif qid == '2d76f2c3-12e6-40a0-a5a7-6fec8c3c4fce':
        q['explanation'] = (
            "আমরা জানি ত্রিকোণমিতিক অভেদ:\n\n"
            "$$\\cos \\theta \\cos(60^{\\circ} - \\theta) \\cos(60^{\\circ} + \\theta) = \\frac{1}{4} \\cos(3\\theta)$$\n\n"
            "অতএব, সঠিক উত্তর $\\frac{1}{4} \\cos(3\\theta)$।"
        )

    # 12. b2467d9b
    elif qid == 'b2467d9b-da2f-4ed9-9c7f-dc399bd8c93f':
        q['explanation'] = (
            "অসমতা $|x + 1| - |x - 3| = 6$ এর সমাধান:\n\n"
            "১. $x \\ge 3$ হলে: $(x + 1) - (x - 3) = 4 \\neq 6$ (অসম্ভব)\n\n"
            "২. $-1 \\le x < 3$ হলে: $(x + 1) - (3 - x) = 2x - 2 = 6 \\implies 2x = 8 \\implies x = 4$ (সীমার বাইরে)\n\n"
            "৩. $x < -1$ হলে: $-(x + 1) - (3 - x) = -4 \\neq 6$\n\n"
            "অতএব, সমীকরণটির কোনো বাস্তব সমাধান নেই, ফাঁকা সেট $\\emptyset$।"
        )

    # 13. 4c93138d
    elif qid == '4c93138d-eda5-4802-ae71-816e27836656':
        q['explanation'] = (
            "অসমতা $|x - 3| \\ge 1$ সমাধান করলে:\n\n"
            "$$x - 3 \\ge 1 \\implies x \\ge 4$$\n\n"
            "অথবা,\n\n"
            "$$x - 3 \\le -1 \\implies x \\le 2$$\n\n"
            "অতএব সমাধান: $x \\le 2$ বা $x \\ge 4$।"
        )

    # 14. 8ccd8e87
    elif qid == '8ccd8e87-ba78-4072-86af-0bff40b27747':
        q['explanation'] = (
            "বৃত্তের সমীকরণ শর্তমতে:\n\n"
            "$$(x - 1)^2 + y^2 = x^2 + (y - 1)^2$$\n\n"
            "উভয়পক্ষ বিস্তার করে পাই:\n\n"
            "$$x^2 - 2x + 1 + y^2 = x^2 + y^2 - 2y + 1$$\n\n"
            "উভয়পক্ষ থেকে $x^2, y^2, 1$ বাদ দিয়ে পাই:\n\n"
            "$$-2x = -2y \\implies x = y$$\n\n"
            "অতএব সঞ্চারপথের সমীকরণ $x - y = 0$।"
        )

    # 15. 5ef9f128
    elif qid == '5ef9f128-766b-42d2-9efc-4ac0ae63459d':
        q['explanation'] = (
            "দ্বিপদী বিস্তৃতিতে সাধারণ পদ:\n\n"
            "$$T_{r+1} = \\binom{n}{r} a^{n-r} b^r$$\n\n"
            "শর্তমতে $x$-বর্জিত পদের জন্য $r = 8$।\n\n"
            "অতএব পদটি হবে $(8+1) = 9$-তম পদ।"
        )

    # 16. 473428d9
    elif qid == '473428d9-2d80-410a-9de0-c24a2a51c506':
        q['explanation'] = (
            "ধরি, $\\sin^{-1}\\left(\\frac{5}{13}\\right) = \\theta_1 \\implies \\tan\\theta_1 = \\frac{5}{12}$\n\n"
            "এবং $\\cos^{-1}\\left(\\frac{3}{5}\\right) = \\theta_2 \\implies \\tan\\theta_2 = \\frac{4}{3}$\n\n"
            "অতএব,\n\n"
            "$$\\tan(\\theta_1 + \\theta_2) = \\frac{\\frac{5}{12} + \\frac{4}{3}}{1 - \\frac{5}{12} \\times \\frac{4}{3}} "
            "= \\frac{\\frac{21}{12}}{\\frac{16}{36}} = \\frac{63}{16}$$\n\n"
            "সুতরাং, $x = \\frac{63}{16}$।"
        )

    # 17. 5d319582
    elif qid == '5d319582-e50d-4c48-a68e-b689a7c64dea':
        q['explanation'] = (
            "দুটি বল $P$ ও $2P$ এর মধ্যবর্তী কোণ $\\alpha$ এবং লব্ধি $R$ হলে:\n\n"
            "$$R^2 = P^2 + (2P)^2 + 2(P)(2P)\\cos\\alpha$$\n\n"
            "শর্তমতে লব্ধি প্রথম বলের সমান হলে, $R = P$:\n\n"
            "$$P^2 = 5P^2 + 4P^2\\cos\\alpha \\implies 4P^2\\cos\\alpha = -4P^2 \\implies \\cos\\alpha = -1$$\n\n"
            "সুতরাং, $\\alpha = 180^{\\circ}$।"
        )

    # 18. ssc-ssc_m_c2-80
    if qid == 'ssc-ssc_m_c2-80':
        if isinstance(q.get('options'), list) and len(q['options']) > 2:
            q['options'][2] = "$\\{x : x \\text{ হলো ১০ এর গুণনীয়ক}\\}$"

    # 19. ssc-ssc_m_c2-66
    if qid == 'ssc-ssc_m_c2-66':
        q['question'] = "যদি $A = \\{x : x \\text{ হলো মৌলিক সংখ্যা এবং } x < 10\\}$ হয়, তবে $A$ সেটের উপাদান সংখ্যা কত?"

    # 20. f3ad455f
    if qid == 'f3ad455f-9812-418b-a251-7a4923a5c8d9':
        q['question'] = "$25^{\\circ}\\text{C}$ তাপমাত্রায় $\\text{N}_2\\text{O}_4$ বিয়োজনে $K_p = 3.0\\text{ atm}$ হলে সাম্যাবস্থায় $\\text{NO}_2$ এর আংশিক চাপ কত?"
        q['explanation'] = (
            "বিয়োজন বিক্রিয়া:\n\n"
            "$$\\text{N}_2\\text{O}_4 \\rightleftharpoons 2\\text{NO}_2$$\n\n"
            "সাম্য ধ্রুবক $K_p$ এর সমীকরণ:\n\n"
            "$$K_p = \\frac{P_{\\text{NO}_2}^2}{P_{\\text{N}_2\\text{O}_4}}$$\n\n"
            "মান বসিয়ে পাই:\n\n"
            "$$3.0 = \\frac{(0.41)^2}{P_{\\text{N}_2\\text{O}_4}} \\implies P_{\\text{N}_2\\text{O}_4} = \\frac{0.1681}{3} = 0.056\\text{ atm}$$\n\n"
            "অতএব, সাম্যাবস্থায় আংশিক চাপ $0.056\\text{ atm}$।"
        )

    # 21. dfb8638d
    if qid == 'dfb8638d-f7b9-465a-8c3a-e7b517001de2':
        q['explanation'] = (
            "$(1 - x)^6$ এর দ্বিপদী বিস্তৃতি:\n\n"
            "$$(1 - x)^6 = 1 - 6x + 15x^2 - 20x^3 + 15x^4 - \\dots$$\n\n"
            "এখন $(1 + 2x + 3x^2)(1 - x)^6$ এ $x^4$-এর সহগ:\n\n"
            "- $1 \\times (15) = 15$\n"
            "- $2 \\times (-20) = -40$\n"
            "- $3 \\times (15) = 45$\n\n"
            "মোট সহগ $= 15 - 40 + 45 = 20$।"
        )

    # 22. 0de79ef6
    if qid == '0de79ef6-e0c4-42a8-89c8-dd8521c397ef':
        q['explanation'] = (
            "$(1 - x)^5$ এর দ্বিপদী বিস্তৃতি:\n\n"
            "$$(1 - x)^5 = 1 - 5x + 10x^2 - 10x^3 + 5x^4 - x^5$$\n\n"
            "এখন $(1 + x + x^2)(1 - x)^5$ এ $x^4$-এর সহগ:\n\n"
            "- $1 \\times 5 = 5$\n"
            "- $1 \\times (-10) = -10$\n"
            "- $1 \\times 10 = 10$\n\n"
            "মোট সহগ $= 5 - 10 + 10 = 5$।"
        )

    # Update correctAnswer
    if 'correctAnswerIndex' in q and q.get('options') and len(q['options']) > q['correctAnswerIndex']:
        q['correctAnswer'] = q['options'][q['correctAnswerIndex']]

with open(QUESTIONS_FILE, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print("Finished targeted fixes and saved questions successfully.")
