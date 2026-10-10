import json
import re

with open("lib/data/public-mock-questions.json") as f:
    questions = json.load(f)

def clean_math_content(m_content):
    if r"\begin{" in m_content:
        return f"${m_content}$"

    # Check if there is Bengali not in \text{}
    without_text = re.sub(r"\\text\{[^\}]*\}", "", m_content)
    if not re.search(r"[\u0980-\u09FF]", without_text):
        # Even without Bengali, fix unclosed trailing ')' if no '(' in math
        if m_content.endswith(")") and "(" not in m_content:
            return f"${m_content[:-1]}$)"
        return f"${m_content}$"

    # If entire content is Bengali words/punctuation
    content_no_bengali = re.sub(r"[\u0980-\u09FF\s,।:;—–\-\(\)\'\"]", "", m_content)
    if not content_no_bengali:
        return m_content

    # Fix unclosed trailing ')' if no '(' in math
    if m_content.endswith(")") and "(" not in m_content:
        return clean_math_content(m_content[:-1]) + ")"

    # Fix leading '(' if no ')' in math
    if m_content.startswith("(") and ")" not in m_content:
        return "(" + clean_math_content(m_content[1:])

    # Check for leading Bengali text e.g. "অর্থাৎ, A = B" or "বর্গমূল (\sqrt{x}"
    lead_match = re.match(r"^([\u0980-\u09FF\s,।:;—–\-\(\)\'\"]+?)(?=[\\0-9a-zA-Z\+\-\*\/=><\^_|])(.*)$", m_content)
    if lead_match:
        lead, rest = lead_match.groups()
        if not rest.strip():
            return lead
        return lead + clean_math_content(rest)

    # Check for trailing Bengali text e.g. "A = B হয়" or "10^{-9}\text{ m} (বা প্রায় 1\text{ nm}"
    trail_match = re.match(r"^(.*?)([\\0-9a-zA-Z\+\-\*\/=><\^_|\}\.\!])([\u0980-\u09FF\s,।:;—–\-\(\)\'\"]+)$", m_content)
    if trail_match:
        prefix, last_char, trail = trail_match.groups()
        math_part = prefix + last_char
        return clean_math_content(math_part) + trail

    # Check for Bengali in the middle between math
    mid_match = re.search(r"([\s,।;]*[\u0980-\u09FF]+[\u0980-\u09FF\s,।:;—–\-\(\)\'\"]*)", m_content)
    if mid_match:
        start, end = mid_match.span()
        left = m_content[:start].strip()
        mid = m_content[start:end]
        right = m_content[end:].strip()
        if left and right:
            return clean_math_content(left) + mid + clean_math_content(right)

    return f"${m_content}$"

def process_field(text):
    if not text or "$" not in text:
        return text

    blocks = []
    def save_display(m):
        blocks.append(m.group(0))
        return f"__DISPLAY_BLOCK_{len(blocks)-1}__"

    text = re.sub(r"\$\$[\s\S]*?\$\$", save_display, text)
    
    # Clean single dollar math
    text = re.sub(r"\$([^\$\n]+?)\$", lambda m: clean_math_content(m.group(1)), text)

    # Restore display blocks
    for i, b in enumerate(blocks):
        text = text.replace(f"__DISPLAY_BLOCK_{i}__", b)

    # Clean up empty math $$ or redundant spaces
    text = re.sub(r"\$\s*\$", "", text)
    # Clean up adjacent math $a$$b$ -> $ab$ or $a$ $b$
    text = re.sub(r"\$([^\$]+)\$\s*\$([^\$]+)\$", r"$\1 \2$", text)

    return text

# Dry run on all questions
modified_count = 0
trapped_remaining = 0
unbalanced_count = 0

for q in questions:
    for f in ["question", "explanation"] + q.get("options", []):
        if not f: continue
        processed = process_field(f)
        if processed != f:
            modified_count += 1
            
        # check unbalanced in processed
        dollars = len(re.findall(r"(?<!\\)\$", processed))
        if dollars % 2 != 0:
            unbalanced_count += 1
            print(f"UNBALANCED in {q['id']}: {processed}")

        # check trapped remaining
        matches = re.finditer(r"\$([^\$\n]+?)\$", processed)
        for m in matches:
            w_text = re.sub(r"\\text\{[^\}]*\}", "", m.group(1))
            if re.search(r"[\u0980-\u09FF]", w_text):
                trapped_remaining += 1

print(f"Total fields modified: {modified_count}")
print(f"Unbalanced dollar fields: {unbalanced_count}")
print(f"Trapped Bengali remaining: {trapped_remaining}")
