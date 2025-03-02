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

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setError(error.message);
    } else {
      router.push("/");
    }
  };

  return (
    <div>
      {error && <p className="text-red-500">{error}</p>}
      <button className={buttonClasses} onClick={handleLogout}>
        {t("logoutButton")}
      </button>
    </div>
  );
}
