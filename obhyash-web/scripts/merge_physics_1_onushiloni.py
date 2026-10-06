import os
import re

# Destination directory
DEST_DIR = "/Volumes/LimonSSD/obhyash materials/onushiloni solve"
DOWNLOADS_DIR = os.path.expanduser("~/Downloads")

# Chapter mapping for Physics 1st Paper
CHAPTER_CONFIG = {
    1: {
        "bengali_num": "১ম",
        "bengali_name": "ভৌত জগৎ ও পরিমাপ",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_1_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_১_ভৌত_জগৎ_ও_পরিমাপ_অনুশীলনী_সলভ.md",
        "files": [
            "gemini-code-1791271829483.md",  # Q 1 - 50
            "gemini-code-1791272295039.md",  # Q 51 - 100
            "gemini-code-1791272777450.md",  # Q 101 - 169
        ],
    },
    2: {
        "bengali_num": "২য়",
        "bengali_name": "ভেক্টর",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_2_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_২_ভেক্টর_অনুশীলনী_সলভ.md",
        "files": [
            "gemini-code-1791271852566.md",  # Q 1 - 50
            "gemini-code-1791272265301.md",  # Q 51 - 65
            "gemini-code-1791272655383.md",  # Q 100 - 200
            "gemini-code-1791272800623.md",  # Q 201 - 216
        ],
    },
    3: {
        "bengali_num": "৩য়",
        "bengali_name": "গতিবিদ্যা",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_3_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_৩_গতিবিদ্যা_অনুশীলনী_সলভ.md",
        "files": [
            "gemini-code-1791271872392.md",  # Q 1 - 50
            "gemini-code-1791272466162.md",  # Q 51 - 100
            "gemini-code-1791272603694.md",  # Q 101+
        ],
    },
    4: {
        "bengali_num": "৪র্থ",
        "bengali_name": "নিউটনিয়ান বলবিদ্যা",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_4_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_৪_নিউটনিয়ান_বলবিদ্যা_অনুশীলনী_সলভ.md",
        "files": [
            "gemini-code-1791271578957.md",  # Q 1 - 50
            "gemini-code-1791272339295.md",  # Q 51 - 100
            "gemini-code-1791272850147.md",  # Q 101 - 163
        ],
    },
    5: {
        "bengali_num": "৫ম",
        "bengali_name": "কাজ, শক্তি ও ক্ষমতা",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_5_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_৫_কাজ_শক্তি_ও_ক্ষমতা_অনুশীলনী_সলভ.md",
        "files": [
            "gemini-code-1791273503290.md",  # Q 1 - 50
            "gemini-code-1791273987610.md",  # Q 51 - 140
        ],
    },
    6: {
        "bengali_num": "৬ষ্ঠ",
        "bengali_name": "মহাকর্ষ ও অভিকর্ষ",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_6_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_৬_মহাকর্ষ_ও_অভিকর্ষ_অনুশীলনী_সলভ.md",
        "files": [
            "code_artifact (1).md",         # Q 1 - 50
            "gemini-code-1791294378831.md",  # Q 51 - 100
            "gemini-code-1791304461875.md",  # Q 101 - 196
        ],
    },
    7: {
        "bengali_num": "৭ম",
        "bengali_name": "পদার্থের গাঠনিক ধর্ম",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_7_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_৭_পদার্থের_গাঠনিক_ধর্ম_অনুশীলনী_সলভ.md",
        "files": [
            "gemini-code-1791304829160.txt",  # Q 1 - 50
            "gemini-code-1791304995957.md",   # Q 51 - 100
            "gemini-code-1791305340273.md",   # Q 101 - 159
        ],
    },
    8: {
        "bengali_num": "৮ম",
        "bengali_name": "পর্যাবৃত্ত গতি",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_8_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_৮_পর্যাবৃত্ত_গতি_অনুশীলনী_সলভ.md",
        "files": [
            "gemini-code-1791306044909.md",  # Q 1 - 50
            "gemini-code-1791306363897.md",  # Q 51 - 136
        ],
    },
    9: {
        "bengali_num": "৯ম",
        "bengali_name": "তরঙ্গ",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_9_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_৯_তরঙ্গ_অনুশীলনী_সলভ.md",
        "files": [
            "physics_chapter_9_mcqs_1_50.md", # Q 1 - 50
            "gemini-code-1791306582939.md",    # Q 51 - 100
            "gemini-code-1791306814668.md",    # Q 101 - 187
        ],
    },
    10: {
        "bengali_num": "১০ম",
        "bengali_name": "আদর্শ গ্যাস ও গ্যাসের গতিতত্ত্ব",
        "slug_en": "HSC_Physics_1st_Paper_Chapter_10_Onushiloni_Solve.md",
        "slug_bn": "পদার্থবিজ্ঞান_১ম_পত্র_অধ্যায়_১০_আদর্শ_গ্যাস_ও_গ্যাসের_গতিতত্ত্ব_অনুশীলনী_সলভ.md",
        "files": [
            "gemini-code-1791307369239.txt",  # Q 1 - 50
            "gemini-code-1791307620786.txt",  # Q 51 - 136
        ],
    },
}

def clean_content(raw_text):
    # Remove cite tags like [cite: 1], [cite: 12, 13]
    text = re.sub(r'\[cite:\s*[\d,\s]+\]', '', raw_text)
    
    # Remove artificial markdown code blocks with placeholder numbers
    text = re.sub(r'```markdown\s*(?:-\s*\d+\s*)+```?', '', text)
    text = re.sub(r'(?:-\s*\d+\s*){5,}', '', text)
    
    lines = text.split('\n')
    cleaned_lines = []
    started_questions = False
    
    for line in lines:
        stripped = line.strip()
        
        # Check if line indicates the start of a question
        # e.g., '### ০১', '**১.', '### প্রশ্ন ১', '### 1.'
        is_q_start = bool(re.match(r'^(?:###|\*\*)\s*(?:প্রশ্ন\s*)?[০-৯0-9]+', stripped))
        
        if not started_questions:
            if is_q_start:
                started_questions = True
            else:
                # Still in document intro/header lines - skip them
                continue
                
        cleaned_lines.append(line)
        
    return '\n'.join(cleaned_lines).strip()

def process_chapter(ch_num, config):
    ch_num_bn = config["bengali_num"]
    ch_name = config["bengali_name"]
    
    print(f"\n==================================================")
    print(f"Processing Chapter {ch_num}: {ch_name}")
    
    merged_sections = []
    
    for filename in config["files"]:
        path = os.path.join(DOWNLOADS_DIR, filename)
        if not os.path.exists(path):
            print(f"ERROR: File not found: {path}")
            continue
            
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            raw_text = f.read()
            
        cleaned = clean_content(raw_text)
        merged_sections.append(cleaned)
        print(f"  + Merged {filename} ({len(cleaned)} chars)")
        
    combined_body = "\n\n---\n\n".join(merged_sections)
    
    # Count total questions
    q_matches = re.findall(r'(?:^|\n)(?:###|\*\*)\s*(?:প্রশ্ন\s*)?([০-৯0-9]+)', combined_body)
    total_q = len(q_matches)
    first_q = q_matches[0] if q_matches else "০১"
    last_q = q_matches[-1] if q_matches else str(total_q)
    
    header = f"# পদার্থবিজ্ঞান ১ম পত্র: {ch_num_bn} অধ্যায় - {ch_name}\n\n**অনুশীলনী সলভ ও প্রশ্নব্যাংক সমাধান (MCQ {first_q} - {last_q})**\n\n---\n\n"
    full_document = header + combined_body + "\n"
    
    # Write English filename
    en_dest = os.path.join(DEST_DIR, config["slug_en"])
    with open(en_dest, "w", encoding="utf-8") as f:
        f.write(full_document)
    print(f"  -> Saved {config['slug_en']} ({len(full_document)} bytes, ~{total_q} Qs)")
    
    # Write Bengali filename (alias matching Chemistry convention)
    bn_dest = os.path.join(DEST_DIR, config["slug_bn"])
    with open(bn_dest, "w", encoding="utf-8") as f:
        f.write(full_document)
    print(f"  -> Saved {config['slug_bn']}")

def main():
    os.makedirs(DEST_DIR, exist_ok=True)
    for ch_num, config in CHAPTER_CONFIG.items():
        process_chapter(ch_num, config)
    print("\nAll 10 chapters merged successfully into:")
    print(DEST_DIR)

if __name__ == "__main__":
    main()
