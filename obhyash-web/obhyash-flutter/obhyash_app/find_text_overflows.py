import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find occurrences of Text( that have variables or interpolations (e.g. `$`, `name`, `title`)
    # and check if they lack maxLines or TextOverflow.
    
    matches = re.finditer(r'Expanded\(\s*child:\s*Text\s*\((.*?)\)(.*?)\)', content, re.DOTALL)
    for m in matches:
        text_args = m.group(1)
        if 'overflow:' not in text_args and 'maxLines:' not in text_args:
            print(f"{filepath} has an Expanded(child: Text(...)) without overflow")
            
    matches2 = re.finditer(r'Flexible\(\s*child:\s*Text\s*\((.*?)\)(.*?)\)', content, re.DOTALL)
    for m in matches2:
        text_args = m.group(1)
        if 'overflow:' not in text_args and 'maxLines:' not in text_args:
            print(f"{filepath} has a Flexible(child: Text(...)) without overflow")
            
    # Also look for Text( inside Row children directly?

for root, _, files in os.walk('lib'):
    for file in files:
        if file.endswith('.dart'):
            process_file(os.path.join(root, file))
