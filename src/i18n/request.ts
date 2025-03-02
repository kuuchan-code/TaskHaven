// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

const SUPPORTED_LOCALES = ["ja", "en"]; // サポートするロケールを定義

export default getRequestConfig(async () => {
  const reqHeaders = await headers();
  const acceptLanguage = reqHeaders.get("accept-language");
  let locale = "ja"; // デフォルト

  if (acceptLanguage) {
    const requestedLocale = acceptLanguage.split(",")[0].split("-")[0];
    if (SUPPORTED_LOCALES.includes(requestedLocale)) {
      locale = requestedLocale;
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
