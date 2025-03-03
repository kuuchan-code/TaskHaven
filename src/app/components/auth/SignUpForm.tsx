"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses, inputClasses } from "../../utils/designUtils";
import { useAuthContext } from "../../utils/context/AuthContext";
import { validateEmail, validateUsername, validatePasswordStrength } from "../../utils/validation";

export const SignUpForm = () => {
  const t = useTranslations("HomePage");
  const {
    signUpUsername,
    setSignUpUsername,
    signUpEmail,
    setSignUpEmail,
    signUpPassword,
    setSignUpPassword,
    showPassword,
    setShowPassword,
    isSigningUp,
    signupComplete,
    error,
    message,
    fieldErrors,
    setFieldErrors,
    handleSignUp,
    checkIfExists,
  } = useAuthContext();
  
  // パスワード強度の状態
  const [passwordStrength, setPasswordStrength] = useState<{
    isValid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    message: string;
  }>({ isValid: false, strength: 'weak', message: '' });

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

  const validateEmailOnChange = (value: string) => {
    if (!value) return;
    
    if (!validateEmail(value)) {
      setFieldErrors({ ...fieldErrors, email: t("errorEmailValidation") });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors.email;
      setFieldErrors(newErrors);
    }
  };

  const handlePasswordChange = (value: string) => {
    setSignUpPassword(value);
    const strength = validatePasswordStrength(value);
    setPasswordStrength(strength);
    
    // 弱いパスワードでもfieldErrorsには設定しない（二重表示を避けるため）
    const newErrors = { ...fieldErrors };
    delete newErrors.password;
    setFieldErrors(newErrors);
  };

  // ブラー時のユーザー名の存在チェック
  const checkUsernameExists = async () => {
    if (!signUpUsername || !validateUsername(signUpUsername)) return;

    const { exists } = await checkIfExists("username", signUpUsername);
    if (exists) {
      setFieldErrors({ ...fieldErrors, username: t("errorUsernameExists") });
    }
  };

  // ブラー時のメールアドレスの存在チェック
  const checkEmailExists = async () => {
    if (!signUpEmail || !validateEmail(signUpEmail)) return;

    const { exists } = await checkIfExists("email", signUpEmail);
    if (exists) {
      setFieldErrors({ ...fieldErrors, email: t("errorEmailExists") });
    }
  };

  if (signupComplete) {
    return (
      <div className="p-6">
        <p className="text-green-600 mb-4">{message}</p>
        <p>{t("checkEmail")}</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && <div className="text-red-500 mb-4">{error}</div>}
      {message && <div className="text-green-600 mb-4">{message}</div>}
      
      <form onSubmit={handleSignUp}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            {t("username")}
          </label>
          <input
            id="username"
            type="text"
            className={`${inputClasses} ${fieldErrors.username ? "border-red-500" : ""}`}
            value={signUpUsername}
            onChange={(e) => {
              setSignUpUsername(e.target.value);
              validateUsernameOnChange(e.target.value);
            }}
            onBlur={checkUsernameExists}
            placeholder={t("usernamePlaceholder")}
          />
          {fieldErrors.username && (
            <p className="text-red-500 text-xs italic">{fieldErrors.username}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            className={`${inputClasses} ${fieldErrors.email ? "border-red-500" : ""}`}
            value={signUpEmail}
            onChange={(e) => {
              setSignUpEmail(e.target.value);
              validateEmailOnChange(e.target.value);
            }}
            onBlur={checkEmailExists}
            placeholder={t("emailPlaceholder")}
          />
          {fieldErrors.email && (
            <p className="text-red-500 text-xs italic">{fieldErrors.email}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            {t("password")}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className={`${inputClasses} ${fieldErrors.password ? "border-red-500" : ""}`}
              value={signUpPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder={t("passwordPlaceholder")}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? t("hide") : t("show")}
            </button>
          </div>
          {signUpPassword && (
            <div className="mt-2">
              <div className="h-2 rounded-full overflow-hidden bg-gray-200">
                <div
                  className={`h-full ${
                    passwordStrength.strength === "weak"
                      ? "bg-red-500"
                      : passwordStrength.strength === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width:
                      passwordStrength.strength === "weak"
                        ? "33%"
                        : passwordStrength.strength === "medium"
                        ? "66%"
                        : "100%",
                  }}
                ></div>
              </div>
              <p
                className={`text-xs mt-1 ${
                  passwordStrength.strength === "weak"
                    ? "text-red-500"
                    : passwordStrength.strength === "medium"
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {passwordStrength.message}
              </p>
            </div>
          )}
          {fieldErrors.password && (
            <p className="text-red-500 text-xs italic">{fieldErrors.password}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`${buttonClasses} bg-blue-500 hover:bg-blue-700 text-white`}
            disabled={isSigningUp}
          >
            {isSigningUp ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("signingUp")}
              </div>
            ) : t("signUp")}
          </button>
        </div>
      </form>
    </div>
  );
}; 