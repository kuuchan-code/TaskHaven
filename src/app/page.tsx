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
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || '', // 必要に応じて設定
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
});


export default function HomePage() {
  const router = useRouter();

  // ユーザー登録用の状態
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // ログイン用の状態
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState<string | null>(null);

  // ユーザー登録処理
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
    // 登録成功時、supabase.auth.users に加えて独自の users テーブルにも username を挿入
    if (data.user) {
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: data.user.id, username: signUpUsername }]);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.push(`/${signUpUsername}`);
    }
  };

  // ログイン処理
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
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
    <div style={{ padding: "2rem" }}>
      <h1>Auth App へようこそ</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <section style={{ marginBottom: "2rem" }}>
        <h2>ユーザー登録</h2>
        <form onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="Username"
            value={signUpUsername}
            onChange={(e) => setSignUpUsername(e.target.value)}
            required
          />
          <br />
          <input
            type="email"
            placeholder="Email"
            value={signUpEmail}
            onChange={(e) => setSignUpEmail(e.target.value)}
            required
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={signUpPassword}
            onChange={(e) => setSignUpPassword(e.target.value)}
            required
          />
          <br />
          <button type="submit">登録する</button>
        </form>
      </section>

      <section>
        <h2>ログイン</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />
          <br />
          <button type="submit">ログイン</button>
        </form>
      </section>
    </div>
  );
}
