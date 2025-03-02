// src/i18n/request.ts
import { getRequestConfig } from "next-intl/server";
import { headers } from "next/headers";

export default getRequestConfig(async () => {
  const reqHeaders = await headers();
  const acceptLanguage = reqHeaders.get("accept-language");
  const locale = acceptLanguage ? acceptLanguage.split(",")[0].split("-")[0] : "ja";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
