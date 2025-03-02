"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./utils/supabase/client";
import { useTranslations } from 'next-intl';

// サニタイジング・バリデーション関数
const validateUsername = (username: string): boolean => {
  // 3～20文字の半角英数字とアンダースコアのみ許可
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

const validateEmail = (email: string): boolean => {
  // 基本的なメールアドレスの形式チェック
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const supabase = createClient();

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('HomePage');

  // サインアップ用の状態
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  // ログイン用の状態（メールアドレス専用）
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // エラー・メッセージ表示用状態
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // コンポーネント初回マウント時にlocalStorageから認証情報を読み込む
  useEffect(() => {
    const savedEmail = localStorage.getItem("loginEmail");
    const savedPassword = localStorage.getItem("loginPassword");
    if (savedEmail) setLoginEmail(savedEmail);
    if (savedPassword) setLoginPassword(savedPassword);
  }, []);

  // ユーザー名の重複チェック関数
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

  // メールアドレスの重複チェック関数
  const checkEmailExists = async (email: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (error) {
      return { error };
    }
    return { exists: !!data };
  };

  // ユーザー登録処理
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const username = signUpUsername.trim();
    const email = signUpEmail.trim().toLowerCase();

    // ユーザー名検証
    if (!validateUsername(username)) {
      setError(
        "ユーザー名は3～20文字の半角英数字またはアンダースコアのみ使用可能です。"
      );
      return;
    }
    // メールアドレス検証
    if (!validateEmail(email)) {
      setError("有効なメールアドレスを入力してください。");
      return;
    }

    // ユーザー名の重複チェック
    const { exists: usernameExists, error: usernameCheckError } =
      await checkUsernameExists(username);
    if (usernameCheckError) {
      setError(usernameCheckError.message);
      return;
    }
    if (usernameExists) {
      setError("このユーザー名はすでに使用されています。別のユーザー名を選んでください。");
      return;
    }

    // メールアドレスの重複チェック
    const { exists: emailExists, error: emailCheckError } =
      await checkEmailExists(email);
    if (emailCheckError) {
      setError(emailCheckError.message);
      return;
    }
    if (emailExists) {
      setError("このメールアドレスはすでに登録されています。別のメールアドレスを使用してください。");
      return;
    }

    // サインアップ処理
    const { data, error } = await supabase.auth.signUp({
      email,
      password: signUpPassword,
      options: { data: { username } },
    });
    if (error) {
      setError(error.message);
      return;
    }
    // Supabase側で確認メールが送信される場合
    if (data.user) {
      // users テーブルにも登録
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: data.user.id, username, email }]);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setMessage("登録完了しました。確認メールを送信しましたので、メールをご確認ください。");
      // router.push(`/${username}`); // 自動リダイレクトする場合
    }
  };

  // ログイン処理（メールアドレスのみ）
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const email = loginEmail.trim().toLowerCase();

    if (!validateEmail(email)) {
      setError("有効なメールアドレスを入力してください。");
      return;
    }

    // ログイン処理
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
      // ログイン成功時に認証情報をlocalStorageへ保存
      localStorage.setItem("loginEmail", email);
      localStorage.setItem("loginPassword", loginPassword);
      router.push(`/${user.user_metadata.username}`);
    } else {
      setError("ユーザー名が見つかりません。");
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          {t('welcomeMessage')}
        </h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {message && <p className="text-green-500 mb-4">{message}</p>}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ユーザー登録
          </h2>
          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label
                htmlFor="signup-username"
                className="block text-sm font-medium text-gray-700"
              >
                ユーザー名
              </label>
              <input
                id="signup-username"
                type="text"
                placeholder="例: john_doe"
                value={signUpUsername}
                onChange={(e) => setSignUpUsername(e.target.value)}
                required
                className="mt-1 w-full p-2 border rounded"
              />
              <p className="mt-1 text-sm text-gray-500">
                3～20文字の半角英数字またはアンダースコアのみ使用可能
              </p>
            </div>
            <div>
              <label
                htmlFor="signup-email"
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                id="signup-email"
                type="email"
                placeholder="例: john@example.com"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label
                htmlFor="signup-password"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード
              </label>
              <input
                id="signup-password"
                type="password"
                placeholder="パスワードを入力"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              登録する
            </button>
          </form>
        </section>
        <section>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ログイン
          </h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                id="login-email"
                type="email"
                placeholder="例: john@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-700"
              >
                パスワード
              </label>
              <input
                id="login-password"
                type="password"
                placeholder="パスワードを入力"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="mt-1 w-full p-2 border rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              ログイン
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
