"use client";

import { useState, useEffect, useMemo } from "react";
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
  // ログイン状態の追加
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);

  // パスワード表示/非表示の状態
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // エラーフィードバックの強化
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    loginEmail?: string;
    loginPassword?: string;
  }>({});

  // パスワードリセット用の状態を追加
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem("loginEmail");
    if (savedEmail) setLoginEmail(savedEmail);
  }, []);

  // 共通の存在チェックヘルパーを改善
  const checkIfExists = async (field: "username" | "email", value: string) => {
    // 大文字小文字を区別せずに検索するために小文字に変換（emailの場合）
    const searchValue = field === "email" ? value.toLowerCase() : value;
    
    const { data, error } = await supabase
      .from("users")
      .select(field)
      .ilike(field, searchValue) // 大文字小文字を区別しない検索
      .maybeSingle();
    
    return { exists: !!data, error };
  };

  // 入力中のリアルタイムバリデーション
  const validateUsernameOnChange = (value: string) => {
    if (!value) return;
    
    if (!validateUsername(value)) {
      setFieldErrors({ ...fieldErrors, username: t("errorUsernameValidation") });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors.username;
      setFieldErrors(newErrors);
    }
  };

  const validateEmailOnChange = (value: string, type: 'signup' | 'login') => {
    if (!value) return;
    
    if (!validateEmail(value)) {
      setFieldErrors({ 
        ...fieldErrors, 
        [type === 'signup' ? 'email' : 'loginEmail']: t("errorEmailValidation") 
      });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors[type === 'signup' ? 'email' : 'loginEmail'];
      setFieldErrors(newErrors);
    }
  };

  // パスワード強度検証関数を修正
  const validatePasswordStrength = (value: string) => {
    if (!value) return { strength: 0, max: 4 };
    
    // パスワード強度の簡易チェック
    const hasMinLength = value.length >= 8;
    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[^a-zA-Z0-9]/.test(value);
    
    const strength = 
      (hasMinLength ? 1 : 0) + 
      (hasLetter ? 1 : 0) + 
      (hasNumber ? 1 : 0) + 
      (hasSpecial ? 1 : 0);
    
    // 状態の更新をここでは行わない（返り値だけを返す）
    return { strength, max: 4 };
  };

  // パスワード入力時の処理を修正
  const handlePasswordChange = (value: string) => {
    setSignUpPassword(value);
    
    // パスワード強度を計算
    const { strength } = validatePasswordStrength(value);
    
    // 強度に基づいてエラーメッセージを設定
    if (!value) {
      // 空の場合はエラーメッセージをクリア
      const newErrors = { ...fieldErrors };
      delete newErrors.password;
      setFieldErrors(newErrors);
    } else if (strength < 2) {
      setFieldErrors({ ...fieldErrors, password: t("passwordTooWeak") });
    } else if (strength < 3) {
      setFieldErrors({ ...fieldErrors, password: t("passwordModerate") });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors.password;
      setFieldErrors(newErrors);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSigningUp(true);
    setSignupComplete(false);

    try {
    const username = signUpUsername.trim();
    const email = signUpEmail.trim().toLowerCase();

      // 入力検証
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

      // ユーザー名の重複チェック - より詳細なエラーメッセージ
    const { exists: usernameExists, error: usernameError } = await checkIfExists("username", username);
      if (usernameError) {
        console.log("【エラー】ユーザー名確認エラー:", usernameError);
        setError(t("errorCheckingUsername"));
        setIsSigningUp(false);
        return;
      }
      if (usernameExists) {
        setError(t("errorUsernameExists"));
        setIsSigningUp(false);
        return;
      }

      // メールアドレスの重複チェック - より詳細なエラーメッセージ
    const { exists: emailExists, error: emailError } = await checkIfExists("email", email);
      if (emailError) {
        console.log("【エラー】メールアドレス確認エラー:", emailError);
        setError(t("errorCheckingEmail"));
        setIsSigningUp(false);
        return;
      }
      if (emailExists) {
        setError(t("errorEmailExists"));
        setIsSigningUp(false);
        return;
      }

      // サインアップ処理
    const { data, error } = await supabase.auth.signUp({
      email,
      password: signUpPassword,
        options: { 
          data: { username },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        },
      });
      
      // Supabase認証エラーの詳細な処理
      if (error) {
        console.log("【エラー】Supabase認証エラー:", error);
        
        // エラータイプに基づいた対応
        if (error.message.includes("email") || error.message.includes("Email")) {
          setError(`${t("errorEmailExists")} ${t("loginAfterSignup")}`);
        } else if (error.message.includes("password") || error.message.includes("Password")) {
          setError(`${error.message}. ${t("passwordRequirements")}`);
        } else {
          setError(`${t("errorAuthSystem")}: ${error.message}`);
        }
        
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
            
            // 409 Conflict (重複エラー)の場合
            if (response.status === 409) {
              const conflictType = result.conflict || 'unknown';
              
              if (conflictType === 'username') {
                setError(t("errorUsernameExists"));
              } else if (conflictType === 'email') {
                setError(t("errorEmailExists"));
              } else {
                setError(result.message || t("errorDuplicateAccount"));
              }
              
              // 重複エラーの場合は完了フラグを設定しない
              setSignupComplete(false);
              setIsSigningUp(false);
              return;
            }
            
            // その他のエラーの場合
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
    setIsLoggingIn(true); // ログイン処理開始時にローディング状態をセット

    const email = loginEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      setError(t("errorEmailValidation"));
      setIsLoggingIn(false); // バリデーションエラー時にローディング状態を解除
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword,
      });
      
      if (error) {
        setError(error.message);
        setIsLoggingIn(false); // エラー時にローディング状態を解除
        return;
      }

      const user = data.user;
      if (user && user.user_metadata?.username) {
        localStorage.setItem("loginEmail", email);
        router.push(`/${user.user_metadata.username}`);
      } else {
        setError(t("errorUserNotFound"));
        setIsLoggingIn(false); // エラー時にローディング状態を解除
      }
    } catch (err) {
      console.error("ログイン中にエラーが発生しました:", err);
      setError(t("errorGeneric"));
      setIsLoggingIn(false); // 例外発生時にローディング状態を解除
    }
  };

  // パスワード強度の計算をメモ化
  const passwordStrength = useMemo(() => {
    return validatePasswordStrength(signUpPassword);
  }, [signUpPassword]);

  // パスワードリセット処理を追加
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetMessage(null);
    setIsResetting(true);
    
    const email = resetEmail.trim().toLowerCase();
    if (!validateEmail(email)) {
      setResetMessage(t("errorEmailValidation"));
      setIsResetting(false);
      return;
    }
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        setResetMessage(error.message);
      } else {
        setResetMessage(t("resetPasswordEmailSent"));
        // 成功したら入力をクリア
        setResetEmail("");
      }
    } catch (err) {
      console.error("パスワードリセット中にエラーが発生しました:", err);
      setResetMessage(t("errorGeneric"));
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 md:space-y-12">
        <h1 className={`text-4xl md:text-5xl font-extrabold text-center ${sectionHeaderClasses} mb-8 md:mb-12`}>
          {t("welcomeMessage")}
        </h1>
        
        {error && (
          <div className="animate-fadeIn bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-l-4 border-red-500">
            <p className="text-red-500 text-center font-medium">{error}</p>
          </div>
        )}
        
        {message && (
          <div className="animate-fadeIn bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-500">
            <p className="text-green-500 text-center font-medium">{message}</p>
          </div>
        )}
        
        {/* サインアップ完了時の表示 */}
        {signupComplete && (
          <div className="animate-fadeIn bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 text-center border border-blue-200 dark:border-blue-800">
            <div className="flex justify-center mb-4">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
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
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* サインアップフォーム */}
          {!signupComplete && (
            <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 md:order-1">
              <h2 className={`${sectionHeaderClasses} mb-4`}>{t("signup")}</h2>
              <form onSubmit={handleSignUp} className="space-y-5">
                <div>
                  <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("username")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-username"
                      type="text"
                      placeholder={t("usernamePlaceholder")}
                      value={signUpUsername}
                      onChange={(e) => {
                        setSignUpUsername(e.target.value);
                        validateUsernameOnChange(e.target.value);
                      }}
                      required
                      className={`${inputClasses} ${fieldErrors.username ? 'border-red-500 dark:border-red-500' : ''}`}
                      aria-invalid={!!fieldErrors.username}
                      aria-describedby="username-error username-help"
                      autoFocus
                    />
                    {fieldErrors.username ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : signUpUsername ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                  {fieldErrors.username && (
                    <p id="username-error" className="mt-1 text-xs text-red-500">{fieldErrors.username}</p>
                  )}
                  <p id="username-help" className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("usernameHelp")}</p>
                </div>
                
                <div>
                  <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("email")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={signUpEmail}
                      onChange={(e) => {
                        setSignUpEmail(e.target.value);
                        validateEmailOnChange(e.target.value, 'signup');
                      }}
                      required
                      className={`${inputClasses} ${fieldErrors.email ? 'border-red-500 dark:border-red-500' : ''}`}
                      aria-invalid={!!fieldErrors.email}
                      aria-describedby="email-error"
                    />
                    {fieldErrors.email ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : signUpEmail && validateEmail(signUpEmail) ? (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : null}
                  </div>
                  {fieldErrors.email && (
                    <p id="email-error" className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t("password")} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("passwordPlaceholder")}
                      value={signUpPassword}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      className={`${inputClasses} pr-10 ${fieldErrors.password ? 'border-red-500 dark:border-red-500' : ''}`}
                      aria-invalid={!!fieldErrors.password}
                      aria-describedby="password-error password-strength"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* パスワード強度インジケーター */}
                  {signUpPassword && (
                    <div id="password-strength" className="mt-2">
                      <div className="flex items-center mb-1">
                        <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              passwordStrength.strength === 1 ? 'bg-red-500' : 
                              passwordStrength.strength === 2 ? 'bg-yellow-500' : 
                              passwordStrength.strength === 3 ? 'bg-green-400' : 
                              'bg-green-500'}`}
                            style={{ 
                              width: `${passwordStrength.strength * 100 / 4}%` 
                            }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {passwordStrength.strength === 1 
                            ? t("passwordWeak") 
                            : passwordStrength.strength === 2 
                              ? t("passwordModerate") 
                              : passwordStrength.strength === 3 
                                ? t("passwordStrong") 
                                : t("passwordVeryStrong")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t("passwordRequirements")}</p>
                    </div>
                  )}
                  
                  {fieldErrors.password && (
                    <p id="password-error" className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
                  )}
                </div>
                
                {/* サインアップボタン - ローディング状態表示 */}
                <button 
                  type="submit" 
                  className={`${buttonClasses} relative w-full mt-6`}
                  disabled={isSigningUp || Object.keys(fieldErrors).some(key => ['username', 'email', 'password'].includes(key))}
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
          <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 md:order-0">
            <h2 className={`${sectionHeaderClasses} mb-4`}>{t("login")}</h2>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("email")} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      validateEmailOnChange(e.target.value, 'login');
                    }}
                    required
                    className={`${inputClasses} ${fieldErrors.loginEmail ? 'border-red-500 dark:border-red-500' : ''}`}
                    aria-invalid={!!fieldErrors.loginEmail}
                    aria-describedby="login-email-error"
                  />
                  {fieldErrors.loginEmail ? (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : null}
                </div>
                {fieldErrors.loginEmail && (
                  <p id="login-email-error" className="mt-1 text-xs text-red-500">{fieldErrors.loginEmail}</p>
                )}
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("password")} <span className="text-red-500">*</span>
                  </label>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      setShowResetModal(true);
                    }} 
                    className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    {t("forgotPassword")}
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showLoginPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className={`${inputClasses} pr-10`}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? t("hidePassword") : t("showPassword")}
                  >
                    {showLoginPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  {t("rememberMe")}
                </label>
              </div>
              
              <button 
                type="submit" 
                className={`${buttonClasses} relative w-full`}
                disabled={isLoggingIn || !!fieldErrors.loginEmail}
              >
                {isLoggingIn ? (
                  <>
                    <span className="opacity-0">{t("login")}</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : t("login")}
              </button>
            </form>
          </section>
        </div>
      </div>
      
      {/* パスワードリセットモーダル */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md relative">
            <button 
              type="button"
              onClick={() => setShowResetModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={t("close")}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className={`${sectionHeaderClasses} mb-4`}>{t("resetPassword")}</h2>
            
            {resetMessage && (
              <div className={`p-3 rounded mb-4 ${
                resetMessage === t("resetPasswordEmailSent") 
                  ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" 
                  : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
              }`}>
                {resetMessage}
              </div>
            )}
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("email")} <span className="text-red-500">*</span>
                </label>
                <input
                  id="reset-email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  className={inputClasses}
                  disabled={isResetting}
                />
              </div>
              
              <button 
                type="submit" 
                className={`${buttonClasses} relative w-full mt-2`}
                disabled={isResetting}
              >
                {isResetting ? (
                  <>
                    <span className="opacity-0">{t("sendResetLink")}</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : t("sendResetLink")}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
