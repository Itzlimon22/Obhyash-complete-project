import os

def replace_in_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('hindSiliguriTextTheme', 'anekBanglaTextTheme')
    new_content = new_content.replace("'HindSiliguri'", "'Anek Bangla'")
    new_content = new_content.replace('"HindSiliguri"', '"Anek Bangla"')
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")

for root, _, files in os.walk('lib'):
    for file in files:
        if file.endswith('.dart'):
            replace_in_file(os.path.join(root, file))
