import os
import re

files_to_process = [
    "src/components/TriviaPanel.tsx",
    "src/components/UnderstandPanel.tsx",
    "src/components/SessionSummary.tsx",
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Apply glass panel styling to generic tertiary components
    content = content.replace('background: "var(--dc-bg-tertiary)"', 'background: "rgba(255, 255, 255, 0.03)"')
    content = content.replace('background: "var(--dc-bg-secondary)"', 'background: "rgba(255, 255, 255, 0.02)"')
    
    # Update styling for standard borders
    content = content.replace('border: "1px solid var(--dc-border)"', 'border: "1px solid rgba(255, 255, 255, 0.08)"')
    content = content.replace('borderBottom: "1px solid var(--dc-border)"', 'borderBottom: "1px solid rgba(255, 255, 255, 0.08)"')

    # Update rounded corners for panels to be more substantial (Bento grid style)
    content = content.replace('className="rounded-xl', 'className="rounded-2xl')
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
