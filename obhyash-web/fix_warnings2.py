import re

filepath = 'obhyash-flutter/obhyash_app/lib/features/history/presentation/exam_history_view.dart'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the unused variable totalTime
content = re.sub(r'int totalTime = 0;\n', '', content)
content = re.sub(r'totalTime \+= r.timeTaken \?\? 0;\n', '', content)

# Rename _toInt to toInt
content = content.replace('int _toInt(dynamic v)', 'int toInt(dynamic v)')
content = content.replace('_toInt(j', 'toInt(j')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
