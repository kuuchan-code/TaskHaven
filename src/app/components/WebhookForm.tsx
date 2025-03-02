"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses, inputClasses } from "../utils/designUtils";

type WebhookFormProps = {
  username: string;
  currentWebhook?: string;
  currentNotificationInterval?: number;
};

export default function WebhookForm({
  username,
  currentWebhook,
  currentNotificationInterval,
}: WebhookFormProps) {
  const t = useTranslations("WebhookForm");
  const [webhook, setWebhook] = useState(currentWebhook || "");
  const [notificationInterval, setNotificationInterval] = useState(currentNotificationInterval ?? 5);
  const [message, setMessage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [urlError, setUrlError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // シンプルなURLバリデーション
  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleWebhookChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWebhook(value);
    setUrlError(value && !validateUrl(value) ? t("invalidUrl") : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (webhook && urlError) {
      setMessage(t("invalidUrl"));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/updateWebhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, webhook_url: webhook, notification_interval: notificationInterval }),
      });
      setMessage(res.ok ? t("updateSuccess") : t("updateFail"));
    } catch {
      setMessage(t("updateFail"));
    }
    setIsSubmitting(false);
  };

  const handleTestWebhook = async () => {
    if (!webhook || urlError) {
      setTestMessage(t("invalidUrl"));
      return;
    }
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: t("testMessageContent") }),
      });
      setTestMessage(res.ok ? t("testSuccess") : t("testFail"));
    } catch {
      setTestMessage(t("testFail"));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t("formHeader")}</h2>
      <p className="text-sm text-red-600 dark:text-red-400 mb-4">{t("webhookRequirement")}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("instructions")}</p>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("webhookLabel")}
          </label>
          <input
            type="url"
            value={webhook}
            onChange={handleWebhookChange}
            placeholder="https://discord.com/api/webhooks/XXXXXXXX/XXXXXXXX"
            className={`${inputClasses} ${urlError ? "border-red-500" : ""}`}
          />
          {urlError && <p className="mt-1 text-xs text-red-500">{urlError}</p>}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("webhookPlaceholderText")}</p>
          <button
            type="button"
            onClick={handleTestWebhook}
            className={`${buttonClasses} mt-2 ${!webhook || urlError ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!webhook || !!urlError}
          >
            {t("testButton")}
          </button>
          {testMessage && (
            <p className={`mt-1 text-xs ${testMessage === t("testSuccess") ? "text-green-500" : "text-red-500"}`}>
              {testMessage}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("notificationIntervalLabel")}
          </label>
          <select
            value={notificationInterval}
            onChange={(e) => setNotificationInterval(Number(e.target.value))}
            className={inputClasses}
          >
            <option value={5}>5 {t("minutes")}</option>
            <option value={10}>10 {t("minutes")}</option>
            <option value={15}>15 {t("minutes")}</option>
            <option value={30}>30 {t("minutes")}</option>
            <option value={60}>60 {t("minutes")}</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("notificationIntervalInfo")}</p>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("notificationCondition")}</p>
        <button type="submit" className={`${buttonClasses} w-full`} disabled={isSubmitting}>
          {isSubmitting ? t("updating") : t("submitButton")}
        </button>
        {message && <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">{message}</p>}
      </form>
    </div>
  );
}
