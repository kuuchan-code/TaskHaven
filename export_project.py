import os

files = [
    "src/app/page.tsx",
    "messages/en.json",
    "messages/ja.json",
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
