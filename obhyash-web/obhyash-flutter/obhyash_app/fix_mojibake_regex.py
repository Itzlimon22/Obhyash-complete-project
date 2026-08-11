import os
import re

def decode_match(match):
    text = match.group(0)
    try:
        # Ignore errors so it doesn't crash on \x8d, just replaces it with ? or drops it
        return text.encode('cp1252', errors='ignore').decode('utf-8', errors='ignore')
    except:
        return text

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'à¦' in content:
        # Match any string of mojibake characters. à¦ is usually the start.
        # It consists of characters in the range \u0080-\u00ff
        new_content = re.sub(r'[à-ÿ][\x80-\xff]*', decode_match, content)
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
    return False

modified_count = 0
for root, _, files in os.walk('lib'):
    for file in files:
        if file.endswith('.dart'):
            if process_file(os.path.join(root, file)):
                modified_count += 1

print(f"Fixed {modified_count} dart files.")
