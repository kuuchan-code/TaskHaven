"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { PriorityLabelProps, ToggleButtonProps, DeadlineShortcutsProps } from "./types";
import { getRelativeDeadline } from "@/app/utils/dateUtils";

// 優先度ラベル
export const PriorityLabel: React.FC<PriorityLabelProps> = ({ priority }) => {
  const t = useTranslations("TaskDashboard");
  if (priority >= 2) {
    return (
      <span className="bg-red-600 dark:bg-red-800 text-white text-xs font-bold rounded-full px-3 py-1 shadow-sm flex items-center justify-center">
        <span className="mr-1">⚠️</span> {t("highPriorityLabel")}
      </span>
    );
  }
  if (priority > 0.64 && priority < 2) {
    return (
      <span className="bg-yellow-500 dark:bg-yellow-700 text-white text-xs font-bold rounded-full px-3 py-1 shadow-sm flex items-center justify-center">
        <span className="mr-1">⚡</span> {t("mediumPriorityLabel")}
      </span>
    );
  }
  return null;
};

// セクションの折りたたみ/展開ボタン
export const ToggleButton: React.FC<ToggleButtonProps> = ({ expanded, onClick, label }) => (
  <button
    onClick={onClick}
    className="flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {expanded ? "▲" : "▼"} {label}
  </button>
);

// 期限設定のショートカットボタン
export const DeadlineShortcuts: React.FC<DeadlineShortcutsProps> = ({ setDeadline }) => {
  const t = useTranslations("TaskDashboard");
  const shortcuts = [
    { key: "shortcut1Hour", hours: 1 },
    { key: "shortcut3Hours", hours: 3 },
    { key: "shortcut1Day", hours: 24 },
    { key: "shortcut3Days", hours: 72 },
    { key: "shortcut1Week", hours: 168 },
  ];
  return (
    <div className="mt-2">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t("deadlineShortcutsLabel")}
      </span>
      <div className="flex flex-wrap gap-2 mt-1">
        {shortcuts.map(({ key, hours }) => (
          <button
            key={hours}
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(hours))}
            className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
}; 