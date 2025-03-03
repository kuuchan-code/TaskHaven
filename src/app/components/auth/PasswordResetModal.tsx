"use client";

import { useTranslations } from "next-intl";
import { buttonClasses, inputClasses } from "../../utils/designUtils";
import { useAuth } from "../../utils/hooks/useAuth";
import { validateEmail } from "../../utils/validation";

export const PasswordResetModal = () => {
  const t = useTranslations("HomePage");
  const {
    resetEmail,
    setResetEmail,
    showResetModal,
    setShowResetModal,
    isResetting,
    resetMessage,
    fieldErrors,
    setFieldErrors,
    handleResetPassword,
  } = useAuth();

  // モーダルが表示されていない場合は何も表示しない
  if (!showResetModal) {
    return null;
  }

  // メールアドレスのバリデーション
  const validateResetEmail = (value: string) => {
    if (!value) return;
    
    if (!validateEmail(value)) {
      setFieldErrors({ ...fieldErrors, resetEmail: t("errorEmailValidation") });
    } else {
      const newErrors = { ...fieldErrors };
      delete newErrors.resetEmail;
      setFieldErrors(newErrors);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={() => setShowResetModal(false)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
        
        <h2 className="text-xl font-bold mb-4">{t("resetPassword")}</h2>
        
        {resetMessage && (
          <div className={`mb-4 p-3 rounded ${resetMessage.includes("エラー") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
            {resetMessage}
          </div>
        )}
        
        <form onSubmit={handleResetPassword}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="resetEmail">
              {t("email")}
            </label>
            <input
              id="resetEmail"
              type="email"
              className={`${inputClasses} ${fieldErrors.resetEmail ? "border-red-500" : ""}`}
              value={resetEmail}
              onChange={(e) => {
                setResetEmail(e.target.value);
                validateResetEmail(e.target.value);
              }}
              placeholder={t("emailPlaceholder")}
            />
            {fieldErrors.resetEmail && (
              <p className="text-red-500 text-xs italic">{fieldErrors.resetEmail}</p>
            )}
            <p className="text-sm text-gray-600 mt-2">{t("resetInstructions")}</p>
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              className={`${buttonClasses} bg-gray-300 hover:bg-gray-400 text-gray-800`}
              onClick={() => setShowResetModal(false)}
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              className={`${buttonClasses} bg-blue-500 hover:bg-blue-700 text-white`}
              disabled={isResetting}
            >
              {isResetting ? t("sending") : t("sendResetLink")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 