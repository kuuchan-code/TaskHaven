"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses, inputClasses } from "../../utils/designUtils";
import { useAuthContext } from "../../utils/context/AuthContext";
import { validateEmail } from "../../utils/validation";

export const LoginForm = () => {
  const t = useTranslations("HomePage");
  const {
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    showLoginPassword,
    setShowLoginPassword,
    rememberMe,
    setRememberMe,
    isLoggingIn,
    error,
    message,
    fieldErrors,
    setFieldErrors,
    setShowResetModal,
    handleLogin,
  } = useAuthContext();

  // ローカルストレージからメールアドレスを取得
  useEffect(() => {
    const savedEmail = localStorage.getItem("loginEmail");
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, [setLoginEmail, setRememberMe]);

  // メールアドレスのバリデーション
  const validateLoginEmail = (value: string) => {
    if (!value) return;
    
    if (!validateEmail(value)) {
      setFieldErrors({ ...fieldErrors, loginEmail: t("errorEmailValidation") });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors.loginEmail;
      setFieldErrors(newErrors);
    }
  };

  return (
    <div className="p-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{message}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={(e) => {
        console.log("ログインフォーム送信");
        handleLogin(e);
      }}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loginEmail">
            {t("email")}
          </label>
          <input
            id="loginEmail"
            type="email"
            className={`${inputClasses} ${fieldErrors.loginEmail ? "border-red-500" : ""}`}
            value={loginEmail}
            onChange={(e) => {
              setLoginEmail(e.target.value);
              validateLoginEmail(e.target.value);
            }}
            placeholder={t("emailPlaceholder")}
          />
          {fieldErrors.loginEmail && (
            <p className="text-red-500 text-xs italic">{fieldErrors.loginEmail}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="loginPassword">
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="loginPassword"
              type={showLoginPassword ? "text" : "password"}
              className={`${inputClasses} ${fieldErrors.loginPassword ? "border-red-500" : ""}`}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
              onClick={() => setShowLoginPassword(!showLoginPassword)}
            >
              {showLoginPassword ? t("hide") : t("show")}
            </button>
          </div>
          {fieldErrors.loginPassword && (
            <p className="text-red-500 text-xs italic">{fieldErrors.loginPassword}</p>
          )}
        </div>
        
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              className="mr-2"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="text-sm text-gray-600" htmlFor="rememberMe">
              {t("rememberMe")}
            </label>
          </div>
          <button
            type="button"
            className="text-blue-500 text-sm hover:text-blue-700"
            onClick={() => setShowResetModal(true)}
          >
            {t("forgotPassword")}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`${buttonClasses} bg-blue-500 hover:bg-blue-700 text-white`}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("loggingIn")}
              </div>
            ) : t("login")}
          </button>
        </div>
      </form>
    </div>
  );
}; 