"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type WebhookFormProps = {
  username: string;
  currentWebhook?: string;
  currentNotificationInterval?: number;
};

export default function WebhookForm({ username, currentWebhook, currentNotificationInterval }: WebhookFormProps) {
  const t = useTranslations("WebhookForm");
  const [webhook, setWebhook] = useState(currentWebhook || "");
  const [notificationInterval, setNotificationInterval] = useState(currentNotificationInterval ?? 5);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/updateWebhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, webhook_url: webhook, notification_interval: notificationInterval }),
    });
    if (res.ok) {
      setMessage(t("updateSuccess"));
    } else {
      setMessage(t("updateFail"));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("formHeader")}</h2>
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {expanded ? `▲ ${t("collapse")}` : `▼ ${t("expand")}`}
        </button>
      </div>
      {expanded && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("instructions")}</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("webhookLabel")}
            </label>
            <input
              type="url"
              value={webhook}
              onChange={(e) => setWebhook(e.target.value)}
              placeholder={currentWebhook || "https://discord.com/api/webhooks/XXXXXXXX/XXXXXXXX"}
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("webhookPlaceholderText")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("notificationIntervalLabel")}
            </label>
            <input
              type="number"
              value={notificationInterval}
              onChange={(e) => setNotificationInterval(Number(e.target.value))}
              placeholder={String(currentNotificationInterval ?? 5)}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("notificationIntervalInfo")}</p>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {t("submitButton")}
          </button>
          {message && (
            <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">{message}</p>
          )}
        </form>
      )}
    </div>
  );
}
