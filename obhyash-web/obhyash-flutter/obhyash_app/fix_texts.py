import os

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    out = []
    i = 0
    changed = False
    while i < len(content):
        # Look for "child: Text("
        idx = content.find('child: Text(', i)
        if idx == -1:
            # Maybe spaces: 'child:  Text('
            import re
            m = re.search(r'child:\s*Text\(', content[i:])
            if not m:
                out.append(content[i:])
                break
            idx = i + m.start()
        
        # We found a Text(. Let's check if it's inside Expanded or Flexible
        # A simple heuristic: check the preceding 50 characters for "Expanded(" or "Flexible("
        preceding = content[max(0, idx-100):idx]
        if 'Expanded(' not in preceding and 'Flexible(' not in preceding:
            out.append(content[i:idx+12])
            i = idx + 12
            continue
            
        # It's inside Expanded/Flexible.
        # Let's extract the full Text() widget by matching parentheses.
        text_start = content.find('(', idx)
        paren_count = 1
        j = text_start + 1
        while j < len(content) and paren_count > 0:
            if content[j] == '(':
                paren_count += 1
            elif content[j] == ')':
                paren_count -= 1
            j += 1
            
        text_widget = content[text_start:j]
        
        # Check if maxLines or overflow is already there
        if 'maxLines:' not in text_widget and 'overflow:' not in text_widget:
            # We want to insert `maxLines: 1, overflow: TextOverflow.ellipsis,` right after the first positional argument.
            # But the first positional arg could be a variable `title` or a string `'Hello'`.
            # A safer place is at the end of the named arguments, just before the closing parenthesis.
            # However, if there are no named args, just before the closing parenthesis is fine too.
            # Wait, `Text(someVar)` -> `Text(someVar, maxLines: 1, overflow: TextOverflow.ellipsis)`
            # So just insert it right before the last closing parenthesis `j-1`
            
            # Make sure it's actually the Text widget closing paren
            
            new_text_widget = text_widget[:-1]
            if new_text_widget.strip()[-1] != ',':
                new_text_widget += ','
            new_text_widget += ' maxLines: 1, overflow: TextOverflow.ellipsis)'
            
            out.append(content[i:text_start])
            out.append(new_text_widget)
            i = j
            changed = True
        else:
            out.append(content[i:j])
            i = j

    if changed:
        with open(filepath, 'w') as f:
            f.write("".join(out))
        print(f"Fixed {filepath}")

for root, _, files in os.walk('lib'):
    for file in files:
        if file.endswith('.dart'):
            process_file(os.path.join(root, file))

