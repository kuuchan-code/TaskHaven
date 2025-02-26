// ./page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white text-center mb-6">
          ホームページ
        </h1>
        <p className="text-center text-gray-700 dark:text-gray-300 mb-8">
          下記のリンクから各ページへアクセスできます。
        </p>
        <div className="flex flex-col space-y-4">
          <Link href="/kuu" className="block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white text-center rounded-md transition duration-200 shadow">
              kuuページへ
          </Link>
          <Link href="/nado" className="block px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-center rounded-md transition duration-200 shadow">
              nadoページへ
          </Link>
        </div>
      </div>
    </div>
  );
}
