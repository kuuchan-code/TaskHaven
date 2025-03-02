"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../utils/supabase/client";
import { useTranslations } from "next-intl";

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
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleLogout}>{t("logoutButton")}</button>
    </div>
  );
}
