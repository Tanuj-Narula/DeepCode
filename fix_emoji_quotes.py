import os
import re

files_to_process = [
    "src/components/Header.tsx",
    "src/components/TriviaPanel.tsx",
    "src/components/UnderstandPanel.tsx",
    "src/components/SessionSummary.tsx",
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Fix quotes around the JSX tags we inserted
    # e.g., "{icon: \"<Target ... />\"}" -> "{icon: <Target ... />}"
    content = re.sub(r'icon:\s*"(<[A-Za-z0-9]+[^>]+/>)"', r'icon: \1', content)
    
    # Check for cases where they were used in JSX text directly inside quotes
    # e.g. `<div ...>"<Target ... />" Test Me</div>`
    content = re.sub(r'"(<[A-Za-z0-9]+[^>]+/>)"', r'\1', content)

    # Some templates used template literals: `\n        <Target />`
    content = re.sub(r'`([^`<]*)(<[A-Za-z0-9]+[^>]+/>)([^`<]*)`', r'{`\1`} \2 {`\3`}', content)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
