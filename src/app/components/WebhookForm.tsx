"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses, inputClasses } from "../utils/designUtils";

type WebhookFormProps = {
  username: string;
  currentWebhook?: string;
  currentNotificationInterval?: number;
  notificationsEnabled?: boolean;
};

export default function WebhookForm({
  username,
  currentWebhook,
  currentNotificationInterval,
  notificationsEnabled = true,
}: WebhookFormProps) {
  const t = useTranslations("WebhookForm");
  const [webhook, setWebhook] = useState(currentWebhook || "");
  const [notificationInterval, setNotificationInterval] = useState(currentNotificationInterval ?? 5);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(notificationsEnabled);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [testMessage, setTestMessage] = useState("");
  const [testMessageType, setTestMessageType] = useState<"success" | "error" | "">("");
  const [urlError, setUrlError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

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
    if (message) setMessage("");
    setUrlError(value && !validateUrl(value) ? t("invalidUrl") : "");
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value);
    
    // 入力が空の場合はデフォルト値の5を設定
    if (isNaN(value)) {
      value = 5;
    }
    
    // 値を1から120の範囲に制限
    value = Math.max(1, Math.min(120, value));
    setNotificationInterval(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 通知が有効でURLが空または無効な場合はエラー
    if (isNotificationsEnabled) {
      if (!webhook) {
        setMessage(t("urlRequired"));
        setMessageType("error");
        return;
      }
      
      if (webhook && urlError) {
        setMessage(t("invalidUrl"));
        setMessageType("error");
        return;
      }
    }
    
    setIsSubmitting(true);
    setMessage("");
    
    try {
      const res = await fetch("/api/updateWebhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username, 
          webhook_url: webhook, 
          notification_interval: notificationInterval,
          notifications_enabled: isNotificationsEnabled 
        }),
      });
      
      if (res.ok) {
        setMessage(t("updateSuccess"));
        setMessageType("success");
      } else {
        setMessage(t("updateFail"));
        setMessageType("error");
      }
    } catch {
      setMessage(t("updateFail"));
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhook || urlError) {
      setTestMessage(t("invalidUrl"));
      setTestMessageType("error");
      return;
    }
    
    setIsTesting(true);
    setTestMessage("");
    
    try {
      const res = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: t("testMessageContent") }),
      });
      
      if (res.ok) {
        setTestMessage(t("testSuccess"));
        setTestMessageType("success");
      } else {
        setTestMessage(t("testFail"));
        setTestMessageType("error");
      }
    } catch {
      setTestMessage(t("testFail"));
      setTestMessageType("error");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-all duration-300 hover:shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t("formHeader")}</h2>
      
      <div className="flex items-center mb-4">
        <p className="text-sm text-red-600 dark:text-red-400">{t("webhookRequirement")}</p>
        <button 
          type="button" 
          className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline focus:outline-none"
          onClick={() => setShowGuide(!showGuide)}
        >
          {showGuide ? t("hideGuide") : t("showGuide")}
        </button>
      </div>
      
      {showGuide && (
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg mb-4 text-sm">
          <h3 className="font-bold mb-2 text-blue-700 dark:text-blue-300">{t("guideTitle")}</h3>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>{t("guideStep1")}</li>
            <li>{t("guideStep2")}</li>
            <li>{t("guideStep3")}</li>
          </ol>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">{t("instructions")}</p>
        
        <div className="flex items-center mb-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isNotificationsEnabled}
              onChange={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{t("enableNotifications")}</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-2">{t("toggleDescription")}</p>

        <div className={isNotificationsEnabled ? "" : "opacity-60"}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("webhookLabel")} {isNotificationsEnabled && <span className="text-red-500">*</span>}
          </label>
          <input
            type="url"
            value={webhook}
            onChange={handleWebhookChange}
            placeholder="https://discord.com/api/webhooks/XXXXXXXX/XXXXXXXX"
            className={`${inputClasses} ${urlError || (isNotificationsEnabled && !webhook) ? "border-red-500 dark:border-red-400" : ""} transition-all duration-200`}
            disabled={!isNotificationsEnabled}
            required={isNotificationsEnabled}
          />
          {urlError && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {urlError}
            </p>
          )}
          {isNotificationsEnabled && !webhook && !urlError && (
            <p className="mt-1 text-xs text-yellow-500 dark:text-yellow-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {t("urlRequired")}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("webhookPlaceholderText")}</p>
          <button
            type="button"
            onClick={handleTestWebhook}
            className={`${buttonClasses} mt-2 flex items-center justify-center min-w-[100px] ${(!webhook || urlError || isTesting || !isNotificationsEnabled) ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!webhook || !!urlError || isTesting || !isNotificationsEnabled}
          >
            {isTesting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t("testing")}
              </>
            ) : (
              t("testButton")
            )}
          </button>
          {testMessage && (
            <p className={`mt-1 text-xs flex items-center ${testMessageType === "success" ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
              {testMessageType === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {testMessage}
            </p>
          )}
        </div>
        <div className={isNotificationsEnabled ? "" : "opacity-60"}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("notificationIntervalLabel")}
          </label>
          <div className="flex items-center">
            <input
              type="number"
              min="1"
              max="120"
              value={notificationInterval}
              onChange={handleIntervalChange}
              className={`${inputClasses} w-24 mr-2 text-center`}
              disabled={!isNotificationsEnabled}
            />
            <span className="text-gray-700 dark:text-gray-300">{t("minutes")}</span>
          </div>
          {t("notificationIntervalInfo") && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("notificationIntervalInfo")}</p>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t("notificationCondition")}</p>
        <button 
          type="submit" 
          className={`${buttonClasses} w-full flex items-center justify-center h-10`} 
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("updating")}
            </>
          ) : (
            t("submitButton")
          )}
        </button>
        {message && (
          <div className={`mt-4 p-2 rounded ${messageType === "success" ? "bg-green-50 dark:bg-green-900/30" : "bg-red-50 dark:bg-red-900/30"}`}>
            <p className={`text-center text-sm flex items-center justify-center ${messageType === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {messageType === "success" ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {message}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
