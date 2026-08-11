import os

def decode_mojibake(text):
    try:
        return text.encode('cp1252').decode('utf-8')
    except Exception as e:
        return text

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'à¦' in content:
        content = decode_mojibake(content)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

modified_count = 0
for root, _, files in os.walk('lib'):
    for file in files:
        if file.endswith('.dart'):
            if process_file(os.path.join(root, file)):
                modified_count += 1

print(f"Fixed {modified_count} dart files.")
