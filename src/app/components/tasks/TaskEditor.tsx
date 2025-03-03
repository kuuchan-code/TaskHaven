"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { DeadlineShortcuts } from "./UIComponents";
import { TaskEditorProps } from "./types";
import { buttonClasses } from "@/app/utils/designUtils";

const TaskEditor: React.FC<TaskEditorProps> = ({
  editingTitle,
  editingImportance,
  editingDeadline,
  setEditingTitle,
  setEditingImportance,
  setEditingDeadline,
  onSave,
  onCancel,
}) => {
  const t = useTranslations("TaskDashboard");
  return (
    <div className="space-y-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-md shadow-inner">
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
          {t("titleLabel")}:
        </label>
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm p-2 bg-white dark:bg-gray-700 dark:text-gray-100"
          placeholder={t("taskTitlePlaceholder")}
          autoFocus
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
          {t("importanceLabel")}: {editingImportance}
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">{t("lowImportance")}</span>
          <input
            type="range"
            min={1}
            max={10}
            value={editingImportance}
            onChange={(e) => setEditingImportance(Number(e.target.value))}
            className="flex-grow"
          />
          <span className="text-xs text-gray-600 dark:text-gray-400">{t("highImportance")}</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
          {t("deadlineLabel")}:
        </label>
        <input
          type="datetime-local"
          value={editingDeadline || ""}
          onChange={(e) => setEditingDeadline(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm p-2 bg-white dark:bg-gray-700 dark:text-gray-100"
        />
        <DeadlineShortcuts setDeadline={setEditingDeadline} />
      </div>
      <div className="flex justify-end space-x-3">
        <button 
          onClick={onSave} 
          className={buttonClasses}
          disabled={!editingTitle.trim()}
        >
          {t("save")}
        </button>
        <button 
          onClick={onCancel} 
          className="w-full px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md shadow hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
};

export default TaskEditor; 