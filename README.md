# TaskHaven

TaskHavenは、タスク管理と定期通知を目的としたNext.jsアプリケーションです。（AIによる自動優先度付け機能も検討中）

デプロイ先: [https://task-haven.pages.dev/](https://task-haven.pages.dev/)

## 主な機能

- タスクの作成、一覧表示、更新、削除 (CRUD)
- Supabaseを利用したユーザー認証
- ユーザーごとのタスク管理
- 多言語対応 (基盤)

## 使用技術

- **フレームワーク**: [Next.js](https://nextjs.org/)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **データ取得/状態管理**: [SWR](https://swr.vercel.app/)
- **バックエンド/データベース**: [Supabase](https://supabase.io/)
- **開発ツール**: [ESLint](https://eslint.org/)

## Getting Started

### 前提条件

- Node.js (バージョン18.x以上を推奨)
- npm, yarn, pnpm, または bun のいずれかのパッケージマネージャー

### セットアップ

1.  リポジトリをクローンします:
    ```bash
    git clone <repository-url>
    cd TaskHaven
    ```

2.  依存関係をインストールします:
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    # or
    # bun install
    ```

3.  環境変数を設定します。
    プロジェクトルートに `.env.local` ファイルを作成し、SupabaseのプロジェクトURLとanonキーを設定してください。通常、これらの値はSupabaseのプロジェクト設定ページから取得できます。
    ```env
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    ```
    (もし他に環境変数が必要な場合は、適宜追加してください。)

4.  開発サーバーを起動します:
    ```bash
    npm run dev
    # or
    # yarn dev
    # or
    # pnpm dev
    # or
    # bun dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
