"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./utils/supabase/client";
import { useTranslations } from "next-intl";
import { buttonClasses, inputClasses, sectionHeaderClasses } from "./utils/designUtils";

const validateUsername = (username: string): boolean =>
  /^[a-zA-Z0-9_]{3,20}$/.test(username);
const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const supabase = createClient();

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations("HomePage");

  // サインアップ用状態
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  // ログイン用状態
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  // エラー・メッセージ状態
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  // サインアップ状態の追加
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("loginEmail");
    if (savedEmail) setLoginEmail(savedEmail);
  }, []);

  // 共通の存在チェックヘルパー
  const checkIfExists = async (field: "username" | "email", value: string) => {
    const { data, error } = await supabase
      .from("users")
      .select(field)
      .eq(field, value)
      .maybeSingle();
    return { exists: !!data, error };
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSigningUp(true); // ローディング状態を開始
    setSignupComplete(false);

    try {
      const username = signUpUsername.trim();
      const email = signUpEmail.trim().toLowerCase();

      if (!validateUsername(username)) {
        setError(t("errorUsernameValidation"));
        setIsSigningUp(false);
        return;
      }
      if (!validateEmail(email)) {
        setError(t("errorEmailValidation"));
        setIsSigningUp(false);
        return;
      }

      const { exists: usernameExists, error: usernameError } = await checkIfExists("username", username);
      if (usernameError) return setError(usernameError.message);
      if (usernameExists) return setError(t("errorUsernameExists"));

      const { exists: emailExists, error: emailError } = await checkIfExists("email", email);
      if (emailError) return setError(emailError.message);
      if (emailExists) return setError(t("errorEmailExists"));

      // サインアップ処理
      const { data, error } = await supabase.auth.signUp({
        email,
        password: signUpPassword,
        options: { 
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });
      if (error) {
        setError(error.message);
        setIsSigningUp(false);
        return;
      }

      // サーバーサイドAPIを使用してユーザー情報を登録
      if (data && data.user) {
        try {
          console.log("【ログ】API呼び出し開始:", { userId: data.user.id, username });
          
          const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.user.id,
              username,
              email
            }),
          });

          const result = await response.json();
          
          if (!response.ok) {
            console.log("【エラー】サーバー側でのユーザー登録エラー:", result);
            // エラーメッセージを表示するが、サインアップ自体は完了したと伝える
            setMessage(`${t("messageSignUpSuccess")} (${result.message || "エラーが発生しましたが、認証は成功しています"})`);
          } else {
            console.log("【成功】ユーザー登録完了:", result);
            setMessage(t("messageSignUpSuccess"));
          }
        } catch (err) {
          console.log("【エラー】APIリクエストエラー:", err);
          // エラーメッセージを表示するが、サインアップ自体は完了したと伝える
          setMessage(`${t("messageSignUpSuccess")} (APIエラーが発生しましたが、認証は成功しています)`);
        }
        
        // サインアップは完了したので状態を更新
        setSignupComplete(true);
        setSignUpUsername("");
        setSignUpEmail("");
        setSignUpPassword("");
      }
    } catch (err) {
      console.log("【エラー】サインアップ処理中のエラー:", err);
      setError(t("errorGeneric"));
    } finally {
      setIsSigningUp(false); // ローディング状態を終了
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const email = loginEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      setError(t("errorEmailValidation"));
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: loginPassword,
    });
    if (error) return setError(error.message);

    const user = data.user;
    if (user && user.user_metadata?.username) {
      localStorage.setItem("loginEmail", email);
      router.push(`/${user.user_metadata.username}`);
    } else {
      setError(t("errorUserNotFound"));
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <h1 className={`text-5xl font-extrabold text-center ${sectionHeaderClasses} mb-12`}>
          {t("welcomeMessage")}
        </h1>
        {error && <p className="text-red-500 text-center font-medium p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</p>}
        {message && <p className="text-green-500 text-center font-medium p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">{message}</p>}
        
        {/* サインアップ完了時の表示 */}
        {signupComplete && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center">
            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">
              {t("signupCompleteTitle")}
            </h2>
            <p className="text-blue-600 dark:text-blue-400 mb-4">
              {t("signupCompleteMessage")}
            </p>
            <p className="text-sm text-blue-500 dark:text-blue-400">
              {t("checkEmailMessage")}
            </p>
          </div>
        )}
        
        {/* サインアップフォーム */}
        {!signupComplete && (
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h2 className={`${sectionHeaderClasses} mb-4`}>{t("signup")}</h2>
            <form onSubmit={handleSignUp} className="space-y-6">
              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("username")}
                </label>
                <input
                  id="signup-username"
                  type="text"
                  placeholder={t("usernamePlaceholder")}
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                  required
                  className={inputClasses}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("usernameHelp")}</p>
              </div>
              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("email")}
                </label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t("password")}
                </label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                  className={inputClasses}
                />
              </div>
              {/* サインアップボタン - ローディング状態表示 */}
              <button 
                type="submit" 
                className={`${buttonClasses} relative`}
                disabled={isSigningUp}
              >
                {isSigningUp ? (
                  <>
                    <span className="opacity-0">{t("signup")}</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : t("signup")}
              </button>
            </form>
          </section>
        )}
        
        {/* ログインセクション */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className={`${sectionHeaderClasses} mb-4`}>{t("login")}</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("email")}
              </label>
              <input
                id="login-email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("password")}
              </label>
              <input
                id="login-password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className={inputClasses}
              />
            </div>
            <button type="submit" className={buttonClasses}>
              {t("login")}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
