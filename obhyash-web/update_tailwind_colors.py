import re
with open("tailwind.config.ts", "r") as f:
    content = f.read()

# Make brand-500 the Deep Green
content = content.replace("500: '#10b981',", "500: '#047857', // Primary Deep Green")
content = content.replace("600: '#059669',", "600: '#065f46',")
content = content.replace("700: '#047857', // Primary Deep Green", "700: '#064e3b',")
content = content.replace("900: '#064e3b',", "900: '#022c22',")

# Make danger-500 the Deep Red
content = content.replace("500: '#ef4444',", "500: '#b91c1c', // Primary Deep Red")
content = content.replace("700: '#b91c1c', // Primary Deep Red", "700: '#991b1b',")
content = content.replace("900: '#7f1d1d',", "900: '#450a0a',")

with open("tailwind.config.ts", "w") as f:
    f.write(content)
