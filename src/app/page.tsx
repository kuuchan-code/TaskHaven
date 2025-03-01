// src/app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";

// サニタイジング・バリデーション関数
const validateUsername = (username: string): boolean => {
  // 3～20文字の半角英数字とアンダースコアのみ許可
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

const validateEmail = (email: string): boolean => {
  // 基本的なメールアドレスの形式チェック
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const supabase = createPagesBrowserClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  cookieOptions: {
    name: "sb:token",
    domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || "",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
});

export default function HomePage() {
  const router = useRouter();

  // サインアップ用の状態
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // ログイン用の状態（メールアドレスまたはユーザー名）
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const checkUsernameExists = async (username: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .maybeSingle();
    if (error) {
      return { error };
    }
    return { exists: !!data };
  };

  // ユーザー登録処理内
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const username = signUpUsername.trim();
    const email = signUpEmail.trim().toLowerCase();

    if (!validateUsername(username)) {
      setError("ユーザー名は3～20文字の半角英数字またはアンダースコアのみ使用可能です。");
      return;
    }

    if (!validateEmail(email)) {
      setError("有効なメールアドレスを入力してください。");
      return;
    }

    // ユーザー名の重複チェック
    const { exists, error: checkError } = await checkUsernameExists(username);
    if (checkError) {
      setError(checkError.message);
      return;
    }
    if (exists) {
      setError("このユーザー名はすでに使用されています。別のユーザー名を選んでください。");
      return;
    }

    // 重複していなければサインアップ処理へ
    const { data, error } = await supabase.auth.signUp({
      email,
      password: signUpPassword,
      options: { data: { username } },
    });
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) {
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: data.user.id, username, email }]);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.push(`/${username}`);
    }
  };


  // ログイン処理（入力値のサニタイジング・バリデーションを実施）
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 前後の空白を除去し、メールの場合は小文字に統一
    const identifier = loginIdentifier.trim();
    let email = identifier;

    // 入力値に "@" が含まれていなければ、ユーザー名とみなしバリデーションを実施
    if (!identifier.includes("@")) {
      if (!validateUsername(identifier)) {
        setError("ユーザー名は3～20文字の半角英数字またはアンダースコアのみが使用可能です。");
        return;
      }
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("email")
        .eq("username", identifier)
        .maybeSingle();
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      if (!userData || !userData.email) {
        setError("このユーザー名に対応するメールアドレスが見つかりません。");
        return;
      }
      email = userData.email;
    } else {
      // メールの場合は形式チェック
      if (!validateEmail(identifier)) {
        setError("有効なメールアドレスを入力してください。");
        return;
      }
    }

    // 取得した email とパスワードでログイン
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
            <div>
              <input
                type="text"
                placeholder="Username"
                value={signUpUsername}
                onChange={(e) => setSignUpUsername(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500">
                3～20文字の半角英数字またはアンダースコアのみ使用可能
              </p>
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500">
                有効なメールアドレスを入力してください
              </p>
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500">
                8文字以上など、必要に応じたパスワードポリシーを記載可能
              </p>
            </div>
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
            <div>
              <input
                type="text"
                placeholder="Email または Username"
                value={loginIdentifier}
                onChange={(e) => setLoginIdentifier(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
              <p className="text-sm text-gray-500">
                メールアドレスの場合はそのまま、ユーザー名の場合は登録済みのアカウント名を入力
              </p>
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full p-2 border rounded"
              />
            </div>
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
