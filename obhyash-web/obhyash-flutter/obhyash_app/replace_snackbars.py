import os
import re

directory = 'lib'

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'ScaffoldMessenger.of(context).showSnackBar' not in content:
        return

    # Add import if missing
    import_statement = "import 'package:obhyash_app/core/utils/app_popups.dart';"
    if import_statement not in content:
        # insert after the last import
        imports = re.findall(r"^import\s+['\"].*?['\"];", content, re.MULTILINE)
        if imports:
            last_import = imports[-1]
            content = content.replace(last_import, last_import + "\n" + import_statement)
        else:
            content = import_statement + "\n" + content

    # Regex to find ScaffoldMessenger block
    # It looks for ScaffoldMessenger.of(...).showSnackBar(...)
    # Because of nested brackets, we'll do a character-by-character parsing

    new_content = ""
    i = 0
    changed = False
    while i < len(content):
        match = re.match(r'ScaffoldMessenger\.of\([^)]+\)\.showSnackBar\s*\(', content[i:])
        if match:
            start_idx = i
            i += match.end()
            bracket_count = 1
            inner_content_start = i
            
            while i < len(content) and bracket_count > 0:
                if content[i] == '(':
                    bracket_count += 1
                elif content[i] == ')':
                    bracket_count -= 1
                i += 1
                
            inner_content = content[inner_content_start:i-1]
            
            # Now we have the inner content of showSnackBar. Let's extract the Text('...') part.
            text_match = re.search(r"Text\(\s*('.*?'|\".*?\"|[^)]+)\s*\)", inner_content, re.DOTALL)
            
            if text_match:
                msg = text_match.group(1).strip()
                # Determine if error
                is_error = 'false'
                if 'Colors.red' in inner_content or 'error' in msg.lower() or 'failed' in msg.lower() or 'সঠিক' in msg:
                    is_error = 'true'
                    
                replacement = f"AppPopups.show(context, message: {msg}, isError: {is_error})"
                
                # Check for trailing semicolon
                # The original might have had a trailing semicolon after the closing bracket.
                # we don't include the semicolon in our match, so it's fine.
                
                new_content += replacement
                changed = True
                continue
            else:
                # Fallback if no Text is found
                new_content += content[start_idx:i]
                continue
                
        new_content += content[i]
        i += 1

    if changed:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith('.dart'):
            process_file(os.path.join(root, file))
