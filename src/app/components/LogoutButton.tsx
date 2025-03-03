// src/app/components/LogoutButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";
import { useTranslations } from "next-intl";
import { buttonClasses } from "../utils/designUtils";

export default function LogoutButton() {
  const t = useTranslations("LogoutButton");
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
      }
    } catch {
      setError(t("logoutFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-500 dark:text-red-400 mb-2 text-sm">{error}</p>}
      <button 
        className={`${buttonClasses} flex items-center justify-center min-w-[120px]`} 
        onClick={handleLogout}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t("loggingOut")}
          </>
        ) : (
          t("logoutButton")
        )}
      </button>
    </div>
  );
}
