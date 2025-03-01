// src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

const supabase = createPagesBrowserClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  cookieOptions: {
    name: 'sb:token',
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
});

export default function HomePage() {
  const router = useRouter();

  // サインアップ用の状態
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // ログイン用の状態（メールではなくユーザー名）
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  // ユーザー登録処理（users テーブルに email も挿入）
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: { data: { username: signUpUsername } },
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) {
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: data.user.id, username: signUpUsername, email: signUpEmail }]);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.push(`/${signUpUsername}`);
    }
  };

  // ログイン処理（username から email を取得してサインイン）
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // users テーブルから username に該当する email を取得
    const { data: userData, error: fetchError } = await supabase
      .from("users")
      .select("email")
      .eq("username", loginUsername)
      .maybeSingle();
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    if (!userData || !userData.email) {
      setError("このユーザー名に対応するメールアドレスが見つかりません。");
      return;
    }
    const email = userData.email;

    if (!email) {
      setError("このユーザー名に対応するメールアドレスが見つかりません。");
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    });
    if (error) {
      setError(error.message);
      return;
    }
    const user = data.user;
    if (user && user.user_metadata && user.user_metadata.username) {
      router.push(`/${user.user_metadata.username}`);
    } else {
      setError("ユーザー名が見つかりません。");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          Task Haven へようこそ
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ユーザー登録
          </h2>
          <form onSubmit={handleSignUp} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={signUpUsername}
              onChange={(e) => setSignUpUsername(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              登録する
            </button>
          </form>
        </section>
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ログイン
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ログイン
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
