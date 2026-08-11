import os
import subprocess

color_map = {
    # GREENS -> Deep Green
    "0xFF059669": "0xFF047857",
    "0xFF10B981": "0xFF047857",
    "0xFF34D399": "0xFF047857",
    "0xFF065F46": "0xFF047857",
    "0xFF064E3B": "0xFF047857",
    "0xFF052E16": "0xFF047857",
    "0xFFD1FAE5": "0xFFECFDF5",
    "0x33047857": "0x33047857",
    "0x33059669": "0x33047857",
    
    # REDS / PINKS -> Deep Red
    "0xFFE11D48": "0xFFB91C1C",
    "0xFFF43F5E": "0xFFB91C1C",
    "0xFFDC2626": "0xFFB91C1C",
    "0xFFEF4444": "0xFFB91C1C",
    "0xFFFFE4E6": "0xFFFEF2F2",
    "0xFFFB7185": "0xFFB91C1C", # Rose 400
    
    # BLUES / PURPLES -> Deep Slate / Black
    "0xFF2563EB": "0xFF0F172A",
    "0xFF3B82F6": "0xFF0F172A",
    "0xFF60A5FA": "0xFF334155",
    "0xFF8B5CF6": "0xFF0F172A",
    "0xFFA855F7": "0xFF0F172A",
    
    # ORANGES -> Gold
    "0xFFF97316": "0xFFF59E0B",
    
    # GRAYS
    "0xFF171717": "0xFF0F172A",
    "0xFF0A0A0A": "0xFF000000",
}

def decode_mojibake(text):
    # Try to decode mojibake back to correct UTF-8.
    # The text was read as mac_roman (default on some macOS python) and written as mac_roman bytes.
    # Wait, if `f.read()` read UTF-8 file using `mac_roman`, it creates a string. 
    # If we encode it back to `mac_roman` we get the original UTF-8 bytes!
    try:
        return text.encode('mac_roman').decode('utf-8')
    except:
        return text

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # First, let's fix the mojibake if it exists.
    if 'à¦' in content: # 'à¦' is a common mojibake signature for Bengali
        content = decode_mojibake(content)
        
    original = content
    for old_color, new_color in color_map.items():
        content = content.replace(old_color, new_color)
    
    if content != original or 'à¦' in original:
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
