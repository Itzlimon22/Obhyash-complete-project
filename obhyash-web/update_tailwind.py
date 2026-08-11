with open("tailwind.config.ts", "r") as f:
    content = f.read()

import re

old_brand = """        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          900: '#881337',
        },"""

new_brand = """        // --- 🟢 STRICT BRAND PALETTE ---
        brand: {
          50: '#ecfdf5',  // Soft Mint (Backgrounds)
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857', // Primary Deep Green
          900: '#064e3b',
        },
        danger: {
          50: '#fef2f2',  // Soft Rose (Backgrounds)
          500: '#ef4444',
          700: '#b91c1c', // Primary Deep Red
          900: '#7f1d1d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b', // Primary Warm Gold
          700: '#b45309',
        },"""

content = content.replace(old_brand, new_brand)

# Remove the red glow if it has pink
old_glow = """glow: '0 0 15px rgba(244, 63, 94, 0.15)',"""
new_glow = """glow: '0 0 15px rgba(4, 120, 87, 0.15)',"""
content = content.replace(old_glow, new_glow)

with open("tailwind.config.ts", "w") as f:
    f.write(content)
