import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replacements
    # deep slate / navy background -> zinc 950 (blackish)
    content = content.replace('0xFF0F172A', '0xFF09090B')
    
    # dark slate / navy card -> zinc 900 (dark gray)
    content = content.replace('0xFF1E293B', '0xFF18181B')
    
    # cool grey dark / border -> zinc 800
    content = content.replace('0xFF334155', '0xFF27272A')

    # other dark grays/blues to unified zinc
    content = content.replace('0xFF1E1E1E', '0xFF18181B')
    
    # 0xFF0C0A09 is already zinc 950, it's fine.

    with open(filepath, 'w') as f:
        f.write(content)

def main():
    lib_dir = 'lib'
    for root, dirs, files in os.walk(lib_dir):
        for file in files:
            if file.endswith('.dart'):
                replace_in_file(os.path.join(root, file))

if __name__ == '__main__':
    main()
