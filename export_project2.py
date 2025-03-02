import os

# 出力するプロンプトファイルの名前
output_filename = "chatgpt_prompt.txt"

# `src` ディレクトリ以下のすべてのファイルを取得
src_directory = "src"
files = []

for root, _, filenames in os.walk(src_directory):
    for filename in filenames:
        files.append(os.path.join(root, filename))

# 書き出し処理
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
