// src/app/components/TaskForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { convertLocalToIsoWithOffset, getRelativeDeadline } from "../utils/dateUtils";
import { buttonClasses, inputClasses } from "../utils/designUtils";

interface TaskFormProps {
  onTaskAdded: () => void;
  username: string;
}

export default function TaskForm({ onTaskAdded, username }: TaskFormProps) {
  const t = useTranslations("TaskForm");
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(1);
  const [deadline, setDeadline] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // クリア関数
  const resetForm = () => {
    setTitle("");
    setImportance(1);
    setDeadline("");
  };

  // エラーメッセージと成功メッセージは自動的に消える
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (successMessage || errorMessage) {
      timer = setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      const deadlineToSend = deadline ? convertLocalToIsoWithOffset(deadline) : null;
      const fcmToken = localStorage.getItem("fcmToken");
      
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          title, 
          importance, 
          deadline: deadlineToSend, 
          username,
          fcmToken
        }),
      });
      
      if (res.ok) {
        onTaskAdded();
        resetForm();
        setSuccessMessage(t("taskAddedSuccess"));
      } else {
        const data = await res.json();
        setErrorMessage(data.error || t("taskAddedError"));
      }
    } catch (error) {
      setErrorMessage(t("taskAddedError"));
      console.error("タスク追加エラー:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8 transition-all duration-300 ease-in-out hover:shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("formHeader")}</h2>
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-expanded={expanded}
          aria-controls="task-form"
        >
          {expanded ? `▲ ${t("collapse")}` : `▼ ${t("expand")}`}
        </button>
      </div>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="p-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 rounded" role="alert">
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="p-2 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100 rounded" role="alert">
              {errorMessage}
            </div>
          )}
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("titleLabel")}：
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputClasses}
              placeholder={t("titlePlaceholder")}
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="task-importance" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("importanceLabel")}：
            </label>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">{t("lowImportance")}</span>
                <input
                  id="task-importance"
                  type="range"
                  min={1}
                  max={10}
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value))}
                  className="flex-grow"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">{t("highImportance")}</span>
              </div>
              <div className="text-sm text-center text-gray-600 dark:text-gray-400">{importance}</div>
            </div>
          </div>
          <div>
            <label htmlFor="task-deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("deadlineLabelOptional")}：
            </label>
            <input
              id="task-deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className={inputClasses}
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("deadlineShortcutsLabel")}
            </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {[
                { key: "shortcut1Hour", offset: 1 },
                { key: "shortcut3Hours", offset: 3 },
                { key: "shortcut1Day", offset: 24 },
                { key: "shortcut3Days", offset: 72 },
                { key: "shortcut1Week", offset: 168 },
              ].map(({ key, offset }) => (
                <button
                  key={offset}
                  type="button"
                  onClick={() => setDeadline(getRelativeDeadline(offset))}
                  className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              type="submit" 
              className={`${buttonClasses} flex-1`}
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? t("addingButton") : t("addButton")}
            </button>
            <button 
              type="button" 
              onClick={resetForm}
              className="flex-1 px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md shadow hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors"
            >
              {t("clearButton")}
            </button>
          </div>
        </form>
      </div>
      {!expanded && (
        <div className="flex justify-center">
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 py-2 px-4 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors flex items-center"
          >
            <span className="mr-1">+</span> {t("quickAddTask")}
          </button>
        </div>
      )}
    </div>
  );
}
