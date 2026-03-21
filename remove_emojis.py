import os
import re

files_to_process = [
    "src/components/Header.tsx",
    "src/components/TriviaPanel.tsx",
    "src/components/UnderstandPanel.tsx",
    "src/components/SessionSummary.tsx",
]

replacements = [
    ("🧪", "<Beaker className=\"inline\" size={18} />", "Beaker"),
    ("🎯", "<Target className=\"inline\" size={16} />", "Target"),
    ("🤔", "<HelpCircle className=\"inline\" size={16} />", "HelpCircle"),
    ("💡", "<Lightbulb className=\"inline\" size={16} />", "Lightbulb"),
    ("🔄", "<RefreshCw className=\"inline\" size={16} />", "RefreshCw"),
    ("✅", "<CheckCircle2 className=\"inline text-dc-success\" size={16} />", "CheckCircle2"),
    ("❌", "<XCircle className=\"inline text-dc-error\" size={16} />", "XCircle"),
    ("🎉", "<Sparkles className=\"inline text-dc-accent-orange\" size={24} />", "Sparkles"),
    ("📖", "<BookOpen className=\"inline\" size={16} />", "BookOpen")
]

for file_path in files_to_process:
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    imports_to_add = set()
    new_content = content
    
    for old, new, icon_name in replacements:
        if old in new_content:
            new_content = new_content.replace(old, new)
            imports_to_add.add(icon_name)
            
    if imports_to_add:
        # Check if lucide-react is already imported
        if "from \"lucide-react\"" in new_content:
            # simple inject into existing if needed or just add another import line
            import_statement = f"import {{ {', '.join(imports_to_add)} }} from \"lucide-react\";\n"
            # It's safer to just prepend it below the last import
        else:
            import_statement = f"import {{ {', '.join(imports_to_add)} }} from \"lucide-react\";\n"
            # find last import
            lines = new_content.splitlines()
            last_import_idx = 0
            for i, line in enumerate(lines):
                if line.startswith("import "):
                    last_import_idx = i
            
            lines.insert(last_import_idx + 1, import_statement)
            new_content = "\n".join(lines)
            
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
        
print("Replaced emojis with Lucide icons.")
