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

    const username = signUpUsername.trim();
    const email = signUpEmail.trim().toLowerCase();

    if (!validateUsername(username)) {
      setError(t("errorUsernameValidation"));
      return;
    }
    if (!validateEmail(email)) {
      setError(t("errorEmailValidation"));
      return;
    }

    const { exists: usernameExists, error: usernameError } = await checkIfExists("username", username);
    if (usernameError) return setError(usernameError.message);
    if (usernameExists) return setError(t("errorUsernameExists"));

    const { exists: emailExists, error: emailError } = await checkIfExists("email", email);
    if (emailError) return setError(emailError.message);
    if (emailExists) return setError(t("errorEmailExists"));

    const { data, error } = await supabase.auth.signUp({
      email,
      password: signUpPassword,
      options: { data: { username } },
    });
    if (error) return setError(error.message);

    if (data.user) {
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ id: data.user.id, username, email }]);
      if (insertError) return setError(insertError.message);
      setMessage(t("messageSignUpSuccess"));
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
        {error && <p className="text-red-500 text-center">{error}</p>}
        {message && <p className="text-green-500 text-center">{message}</p>}
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
            <button type="submit" className={buttonClasses}>
              {t("signup")}
            </button>
          </form>
        </section>
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
