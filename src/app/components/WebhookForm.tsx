// src/app/components/WebhookForm.tsx
"use client";

import { useState } from 'react';

type WebhookFormProps = {
  username: string;
  currentWebhook?: string;
};

export default function WebhookForm({ username, currentWebhook }: WebhookFormProps) {
  const [webhook, setWebhook] = useState(currentWebhook || "");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/updateWebhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, webhook_url: webhook }),
    });
    if (res.ok) {
      setMessage("Webhook URL が更新されました");
    } else {
      setMessage("更新に失敗しました");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Webhook 設定</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Discord Webhook URL
          </label>
          <input
            type="url"
            value={webhook}
            onChange={(e) => setWebhook(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            required
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
        >
          更新する
        </button>
        {message && (
          <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
