import re

filepath = 'obhyash-flutter/obhyash_app/lib/features/history/presentation/exam_history_view.dart'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace withOpacity(x) with withValues(alpha: x)
content = re.sub(r'\.withOpacity\((.*?)\)', r'.withValues(alpha: \1)', content)

# Remove the unused variables avgTime and totalTimeMins
content = re.sub(r'final avgTime = .*?;\n', '', content)
content = re.sub(r'final totalTimeMins = .*?;\n', '', content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
