import os

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

    # Revert glass panel styling back to variable-based solid themes
    content = content.replace('background: "rgba(255, 255, 255, 0.03)"', 'background: "var(--dc-bg-tertiary)"')
    content = content.replace('background: "rgba(255, 255, 255, 0.02)"', 'background: "var(--dc-bg-secondary)"')
    
    # Revert borders
    content = content.replace('border: "1px solid rgba(255, 255, 255, 0.08)"', 'border: "1px solid var(--dc-border)"')
    content = content.replace('border: "1px solid rgba(255, 255, 255, 0.05)"', 'border: "1px solid var(--dc-border)"')
    content = content.replace('borderBottom: "1px solid rgba(255, 255, 255, 0.08)"', 'borderBottom: "1px solid var(--dc-border)"')
    content = content.replace('borderBottom: "1px solid rgba(255, 255, 255, 0.05)"', 'borderBottom: "1px solid var(--dc-border)"')

    # Remove extra classes
    content = content.replace('backdrop-blur-sm', '')
    content = content.replace('relative z-10', '')

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
