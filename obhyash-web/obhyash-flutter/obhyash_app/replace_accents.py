import os
import re

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Standard replacements
    replacements = {
        'আপনার': 'তোমার',
        'আপনাকে': 'তোমাকে',
        'আপনি ': 'তুমি ',
        'আপনিই': 'তুমিও',
        'আপনিও': 'তুমিও',
        'করুন': 'করো',
        'লিখুন': 'লেখো',
        'দেখুন': 'দেখো',
        
        # specific contexts for "give" (din -> dao)
        'ইমেইল দিন': 'ইমেইল দাও',
        'পাসওয়ার্ড দিন': 'পাসওয়ার্ড দাও',
        'নম্বর দিন': 'নম্বর দাও',
        'আইডি দিন': 'আইডি দাও',
        'ঠিকানা দিন': 'ঠিকানা দাও',
        'পরীক্ষা দিন': 'পরীক্ষা দাও',
        'যোগ দিন': 'যোগ দাও',

        # Other verb corrections for "তুমি"
        'দিয়েছেন': 'দিয়েছো',
        'করেছেন': 'করেছো',
        'পেয়েছেন': 'পেয়েছো',
        'চান': 'চাও',
        
        # Specific sentences
        'আপনি কি সত্যিই বের হতে চান?': 'তুমি কি সত্যিই বের হতে চাও?',
        'আপনি এই বিষয়টি খুব ভালো আয়ত্ত করেছেন': 'তুমি এই বিষয়টি খুব ভালো আয়ত্ত করেছো',
        'আপনি সঠিক পথে আছেন': 'তুমি সঠিক পথে আছো',
    }

    # Replace 'আপনি' explicitly avoiding matching words that contain 'আপনি' inside them if any (rare in Bengali but good to be safe)
    # Actually, direct replace is mostly fine for these words.
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    # Also handle 'আপনি' as an exact word if followed by punctuation
    content = content.replace('আপনি,', 'তুমি,')
    content = content.replace('আপনি?', 'তুমি?')
    content = content.replace('আপনি।', 'তুমি।')
    content = content.replace("'আপনি'", "'তুমি'")

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {file_path}")

def main():
    lib_dir = 'lib'
    for root, dirs, files in os.walk(lib_dir):
        for file in files:
            if file.endswith('.dart'):
                process_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
