import os
import re

# We will map common hardcoded colors to AppTheme colors.
# This ensures a unified look across the app.

color_map = {
    # 🟢 GREENS -> Deep Green
    "0xFF059669": "0xFF047857", # Emerald 600 -> Deep Green
    "0xFF10B981": "0xFF047857", # Emerald 500 -> Deep Green
    "0xFF34D399": "0xFF047857", # Emerald 400 -> Deep Green
    "0xFF065F46": "0xFF047857", # Emerald 800 -> Deep Green
    "0xFF064E3B": "0xFF047857", # Emerald 900 -> Deep Green
    "0xFF052E16": "0xFF047857", # Emerald 950 -> Deep Green
    "0xFFD1FAE5": "0xFFECFDF5", # Emerald 100 -> Soft Mint
    "0x33047857": "0x33047857", # Keep alpha
    "0x33059669": "0x33047857",
    
    # 🔴 REDS / PINKS -> Deep Red
    "0xFFE11D48": "0xFFB91C1C", # Rose 600 -> Deep Red
    "0xFFF43F5E": "0xFFB91C1C", # Rose 500 -> Deep Red
    "0xFFDC2626": "0xFFB91C1C", # Red 600 -> Deep Red
    "0xFFEF4444": "0xFFB91C1C", # Red 500 -> Deep Red
    "0xFFFFE4E6": "0xFFFEF2F2", # Rose 100 -> Soft Rose
    
    # 🔵 BLUES / PURPLES -> Deep Slate / Black
    "0xFF2563EB": "0xFF0F172A", # Blue 600 -> Deep Slate
    "0xFF3B82F6": "0xFF0F172A", # Blue 500 -> Deep Slate
    "0xFF60A5FA": "0xFF334155", # Blue 400 -> Cool Grey Dark
    "0xFF8B5CF6": "0xFF0F172A", # Violet 500 -> Deep Slate
    "0xFFA855F7": "0xFF0F172A", # Purple 500 -> Deep Slate
    
    # 🟡 ORANGES -> Gold
    "0xFFF97316": "0xFFF59E0B", # Orange 500 -> Gold
    
    # ⚫ GRAYS (Optional normalization, I'll leave them as is if they are UI grays)
    "0xFF171717": "0xFF0F172A", # Neutral 900 -> Deep Slate
    "0xFF0A0A0A": "0xFF000000", # Neutral 950 -> Pure Black
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    original = content
    for old_color, new_color in color_map.items():
        content = content.replace(old_color, new_color)
    
    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        return True
    return False

modified_count = 0
for root, _, files in os.walk('lib'):
    for file in files:
        if file.endswith('.dart'):
            if process_file(os.path.join(root, file)):
                modified_count += 1

print(f"Modified {modified_count} dart files.")
