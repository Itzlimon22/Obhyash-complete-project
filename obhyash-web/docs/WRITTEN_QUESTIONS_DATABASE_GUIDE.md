# 📘 Written Questions Database Upload & Schema Guide
**Target Table:** `public.written_questions` (Supabase PostgreSQL)  
**Applicable For:** BUET, CKRUET, DU, Medical, Board CQ, এবং যেকোনো লিখিত (Written / CQ) পরীক্ষার প্রশ্নব্যাংক।

---

## 🌟 ১. মূল নীতিমালা (Golden Rules)
১. **সঠিক টেবিল নির্বাচন:** লিখিত প্রশ্নগুলো কখনোই সাধারণ MCQ `questions` টেবিলে আপলোড করবেন না। এগুলো **শুধুমাত্র `written_questions` টেবিলে** আপলোড করতে হবে।  
২. **ট্যাগিং ও সেশন ম্যাচিং:** অ্যাপে প্রশ্ন প্রদর্শনের জন্য `institutes` (অ্যারে) এবং `years` (ইন্টিজার অ্যারে) কলাম সঠিকভাবে পূরণ করা আবশ্যক।  
৩. **LaTeX ফরম্যাটিং:** প্রশ্নের গাণিতিক ও বৈজ্ঞানিক সমীকরণ অবশ্যই LaTeX (`$...$` ইনলাইন অথবা `$$...$$` ব্লক) সিনট্যাক্সে হতে হবে।  
৪. **মডেল সলিউশন (`explanation`):** লিখিত পরীক্ষায় শিক্ষার্থী অপশন দেখবে না, তাই বিস্তারিত ব্যাখ্যা/সমাধান (`explanation` কলাম) অত্যন্ত গুরুত্বপূর্ণ।

---

## 📊 ২. টেবিল স্কিমা বিবরণ (`written_questions`)

| Column Name | PostgreSQL Data Type | Default Value | বিবরণ ও গ্রহণযোগ্য মান |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `gen_random_uuid()` | ইউনিক প্রশ্ন আইডি (অটোমেটিক তৈরি হয়) |
| `question` | `TEXT` | **NOT NULL** | মূল প্রশ্ন বা উদ্দীপক (LaTeX ফরম্যাট সমর্থিত) |
| `explanation` | `TEXT` | `NULL` | পূর্ণাঙ্গ গাণিতিক সমাধান ও মডেল উত্তর (LaTeX) |
| `total_marks` | `INTEGER` | `10` | প্রশ্নের পূর্ণমান (যেমন: বুয়েটের জন্য `10`, ঢাবির জন্য `2.5` বা `4`, সিকিউ এর জন্য `10`) |
| `type` | `VARCHAR(50)` | `'Written'` | `'Written'` অথবা `'CQ'` |
| `difficulty` | `VARCHAR(50)` | `'Medium'` | `'Easy'`, `'Medium'`, `'Hard'` |
| `stream` | `VARCHAR(50)` | `'HSC'` | `'Admission'`, `'HSC'`, `'SSC'` |
| `division` | `VARCHAR(50)` | `'Science'` | `'Science'`, `'Arts'`, `'Commerce'` |
| `subject` | `VARCHAR(255)` | **NOT NULL** | প্রমিত বিষয়ের নাম (যেমন: `'পদার্থবিজ্ঞান ১ম পত্র'`) |
| `chapter` | `VARCHAR(255)` | **NOT NULL** | অধ্যায়ের নাম (যেমন: `'ভেক্টর'`) |
| `topic` | `VARCHAR(255)` | `NULL` | সুনির্দিষ্ট টপিক (ঐচ্ছিক) |
| `exam_type` | `VARCHAR(100)` | `'Admission'` | `'Admission'` অথবা `'Academic'` |
| `institutes` | `TEXT[]` | `'{}'` | **অত্যন্ত গুরুত্বপূর্ণ:** যেমন `ARRAY['BUET', 'বুয়েট']` |
| `years` | `INTEGER[]` | `'{}'` | **অত্যন্ত গুরুত্বপূর্ণ:** যেমন `ARRAY[2023, 2024]` (ইন্টিজার) |
| `exam_history`| `JSONB` | `'[]'::jsonb`| ব্যাজ ও মেটাডাটার জন্য: `[{"institute": "বুয়েট", "year": 2023, "code": "BUET"}]` |
| `sub_questions`| `JSONB` | `'[]'::jsonb`| সিকিউ এর ক, খ, গ, ঘ অংশের জন্য (ঐচ্ছিক) |
| `fingerprint` | `VARCHAR(64)` | `NULL` | ডুপ্লিকেট রোধক MD5 হ্যাশ (`md5(subject \| chapter \| question)`) |
| `image_url` | `TEXT` | `NULL` | প্রশ্নের চিত্রের পাবলিক URL (যদি থাকে) |
| `explanation_image_url` | `TEXT` | `NULL` | সলিউশন চিত্রের পাবলিক URL (যদি থাকে) |
| `status` | `VARCHAR(50)` | `'Approved'` | `'Approved'` (অপ্রুভড ছাড়া অ্যাপে দেখাবে না) |
| `author` | `VARCHAR(255)` | `'Admin'` | ডাটা এন্ট্রি লেখকের নাম |

---

## 🏷️ ৩. প্রতিষ্ঠান ট্যাগ ম্যাপিং (`institutes` Column)
অ্যাপের সার্চ ফিল্টার `overlaps` অপারেটর দিয়ে `institutes` কলাম চেক করে। নিচের মানগুলো ব্যবহার করুন:

| প্রতিষ্ঠান | অ্যাপের Institute ID | `institutes` কলামে যা থাকতে হবে |
| :--- | :--- | :--- |
| **বুয়েট (BUET)** | `buet` | `['BUET', 'বুয়েট']` |
| **চুয়েট-কুয়েট-রুয়েট গুচ্ছ** | `ckruet` | `['CKRUET', 'গুচ্ছ ইঞ্জিঃ', 'চুয়েট-কুয়েট-রুয়েট']` |
| **ঢাকা বিশ্ববিদ্যালয় (DU)** | `du` / `varsity_ka` | `['DU', 'ঢাবি', 'Dhaka University']` |
| **জাহাঙ্গীরনগর বিশ্ববিদ্যালয়**| `ju` | `['JU', 'জাবি', 'Jahangirnagar University']` |
| **রাজশাহী বিশ্ববিদ্যালয়** | `ru` | `['RU', 'রাবি', 'Rajshahi University']` |
| **চট্টগ্রাম বিশ্ববিদ্যালয়** | `cu` | `['CU', 'চবি', 'Chittagong University']` |
| **শাবিপ্রবি (SUST)** | `sust` | `['SUST', 'শাবিপ্রবি']` |
| **বুটেক্স (BUTEX)** | `butex` | `['BUTEX', 'বুটেক্স']` |
| **এমআইএসটি (MIST)** | `mist` | `['MIST', 'মিরপুর এমআইএসটি']` |
| **আইইউটি (IUT)** | `iut` | `['IUT']` |
| **জিএসটি সাধারণ গুচ্ছ** | `gst` | `['GST', 'গুচ্ছ']` |
| **কৃষি গুচ্ছ** | `agri` | `['Agri', 'কৃষি গুচ্ছ']` |
| **মেডিকেল** | `medical` | `['Medical', 'মেডিকেল']` |
| **ঢাকা বোর্ড** | `board_dhaka` | `['DB', 'ঢাকা বোর্ড']` |

> ⚠️ **সতর্কতা:** CKRUET গুচ্ছের প্রশ্নে কখনো শুধু `RUET` বা `KUET` ট্যাগ দেবেন না; একক বিশ্ববিদ্যালয়ের প্রশ্ন CKRUET-এ আসা বন্ধ রাখতে সবসময় `CKRUET` ট্যাগ ব্যবহার করুন।

---

## 📅 ৪. শিক্ষাবর্ষ ও সেশন ম্যাপিং (`years` & `exam_history`)
- **`years` কলামে অবশ্যই ৪ সংখ্যার ইন্টিজার (INTEGER) দিতে হবে:**
  - সেশন `2023-24` হলে: `[2023, 2024]` অথবা `[2023]`
  - কখনোই স্ট্রিং হিসেবে `['2023-24']` দিবেন না, এটি ইন্টিজার অ্যারে (`INTEGER[]`)।
- **`exam_history` JSONB ফরম্যাট:**
  ```json
  [
    {
      "institute": "বুয়েট",
      "year": 2023,
      "code": "BUET"
    }
  ]
  ```
  এটি দিলে কার্ডে স্বয়ংক্রিয়ভাবে `BUET '23` বা `DU '22` সুন্দর ব্যাজ রেন্ডার হয়।

---

## 📚 ৫. বিষয়ের প্রমিত নাম (`subject` Column)
অ্যাপের সিরিয়াল সর্টিং (Physics ➔ Chemistry ➔ Math ➔ Biology) এবং ট্যাব ফিল্টারের জন্য নিচের নামগুলো ব্যবহার করুন:

1. **পদার্থবিজ্ঞান:**
   - `পদার্থবিজ্ঞান ১ম পত্র`
   - `পদার্থবিজ্ঞান ২য় পত্র`
2. **রসায়ন:**
   - `রসায়ন ১ম পত্র`
   - `রসায়ন ২য় পত্র`
3. **উচ্চতর গণিত:**
   - `উচ্চতর গণিত ১ম পত্র`
   - `উচ্চতর গণিত ২য় পত্র`
4. **জীববিজ্ঞান:**
   - `জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)`
   - `জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)`
5. **অন্যান্য:**
   - `ইংরেজি`
   - `বাংলা`
   - `তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)`

---

## 🐍 ৬. Python ডাটা আপলোড স্ক্রিপ্ট উদাহরণ

```python
import hashlib
from supabase import create_client

SUPABASE_URL = "https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def generate_fingerprint(subject: str, chapter: str, question: str) -> str:
    text = f"{subject.strip()}|{chapter.strip()}|{question.strip()}"
    return hashlib.md5(text.encode("utf-8")).hexdigest()

# প্রশ্নের নমুনা ডেটা
sample_buet_question = {
    "question": r"একটি প্রাসের প্রক্ষেপণ কোণ $30^\circ$ এবং প্রক্ষেপণ বেগ $40\text{ m/s}$ হলে প্রাসটির সর্বোচ্চ উচ্চতা কত?",
    "explanation": r"""**সমাধান:**
আমরা জানি, সর্বোচ্চ উচ্চতা,
$$H = \frac{v_0^2 \sin^2\theta}{2g}$$

এখানে,
- $v_0 = 40\text{ m/s}$
- $\theta = 30^\circ$
- $g = 9.8\text{ m/s}^2$

মান বসিয়ে পাই:
$$H = \frac{(40)^2 \cdot (\sin 30^\circ)^2}{2 \times 9.8} = \frac{1600 \times 0.25}{19.6} \approx 20.41\text{ m}$$

**উত্তর:** $20.41\text{ m}$""",
    "total_marks": 10,
    "type": "Written",
    "difficulty": "Medium",
    "stream": "Admission",
    "division": "Science",
    "subject": "পদার্থবিজ্ঞান ১ম পত্র",
    "chapter": "গতিবিদ্যা",
    "topic": "প্রাসের গতি",
    "exam_type": "Admission",
    "institutes": ["BUET", "বুয়েট"],
    "years": [2023, 2024],
    "exam_history": [
        {"institute": "বুয়েট", "year": 2023, "code": "BUET"}
    ],
    "status": "Approved",
    "author": "QuestionExtractorBot"
}

# ফিঙ্গারপ্রিন্ট যুক্ত করা
sample_buet_question["fingerprint"] = generate_fingerprint(
    sample_buet_question["subject"],
    sample_buet_question["chapter"],
    sample_buet_question["question"]
)

# আপলোড বা আপসার্ট (Upsert)
response = supabase.table("written_questions").upsert(
    sample_buet_question,
    on_conflict="fingerprint"
).execute()

print("আপলোড সম্পন্ন:", response)
```

---

## ⚡ ৭. কমন ভুল ও সমাধানের চেকলিস্ট

| সমস্যা | কারণ | সমাধান |
| :--- | :--- | :--- |
| **অ্যাপে "শীঘ্রই যুক্ত করা হবে" টোস্ট আসছে** | ১. ডাটাবেজে `years` বা `institutes` ম্যাচ করেনি।<br>২. `status` কলাম `'Approved'` করা হয়নি। | ১. `institutes` অ্যারেতে সঠিক ট্যাগ (যেমন: `BUET`) এবং `years` এ সংখ্যা (যেমন: `2023`) নিশ্চিত করুন।<br>২. `status = 'Approved'` রাখুন। |
| **কার্ডে মান দেখাচ্ছে না** | `total_marks` শূন্য বা নাল রাখা হয়েছে। | প্রতি প্রশ্নে `total_marks: 10` (বা প্রযোজ্য মান) দিন। |
| **সূত্র বা LaTeX ভেঙে গেছে** | ব্যাকস্ল্যাশ এস্কেপ না করা (Python-এ `r"..."` ব্যবহার না করা)। | পাইথনে স্ট্রিং তৈরিতে সবসময় Raw string `r"..."` ব্যবহার করুন। |
| **সোর্স ব্যাজ খালি** | `exam_history` বা `institutes` দেয়া হয়নি। | `institutes: ['BUET']` অথবা `exam_history` ফিল্ড দিন। |
