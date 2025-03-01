import os

files = [
    "src/app/[username]/page.tsx",
    "src/app/api/tasks/route.ts",
    "src/app/api/updateWebhook/route.ts",
    "src/app/components/InteractiveTaskDashboard.tsx",
    "src/app/components/TaskForm.tsx",
    "src/app/components/TaskPage.tsx",
    "src/app/components/WebhookForm.tsx",
    "src/app/page.tsx",
    "supabase/functions/notify-tasks/index.ts"
]

# 出力するプロンプトファイルの名前
output_filename = "chatgpt_prompt.txt"

with open(output_filename, "w", encoding="utf-8") as outfile:    
    for filepath in files:
        outfile.write(f"### {filepath} ###\n")
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as infile:
                content = infile.read()
                outfile.write(content)
        else:
            outfile.write(f"※ {filepath} は存在しません\n")
        outfile.write("\n\n" + ("-" * 80) + "\n\n")

print(f"プロンプト用のファイル '{output_filename}' を出力しました。")
