// src/app/components/TaskForm.tsx
import { useState } from "react";
import { useTranslations } from "next-intl";

interface TaskFormProps {
  onTaskAdded: () => void;
  username: string;
}

const convertLocalToIsoWithOffset = (localDateString: string): string => {
  const localDate = new Date(localDateString);
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = localDate.getFullYear();
  const month = pad(localDate.getMonth() + 1);
  const day = pad(localDate.getDate());
  const hours = pad(localDate.getHours());
  const minutes = pad(localDate.getMinutes());
  const seconds = pad(localDate.getSeconds());
  const timezoneOffset = -localDate.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
  const offsetMinutes = pad(Math.abs(timezoneOffset) % 60);
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
};

export default function TaskForm({ onTaskAdded, username }: TaskFormProps) {
  const t = useTranslations("TaskForm");
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(1);
  const [deadline, setDeadline] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [expanded, setExpanded] = useState(true);

  const getRelativeDeadline = (hoursOffset: number): string => {
    const date = new Date();
    date.setHours(date.getHours() + hoursOffset);
    const pad = (num: number) => String(num).padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const deadlineToSend = deadline ? convertLocalToIsoWithOffset(deadline) : null;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, importance, deadline: deadlineToSend, username }),
    });
    if (res.ok) {
      onTaskAdded();
      setTitle("");
      setImportance(1);
      setDeadline("");
      setSuccessMessage(t("taskAddedSuccess"));
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t("formHeader")}</h2>
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {expanded ? `▲ ${t("collapse")}` : `▼ ${t("expand")}`}
        </button>
      </div>
      {expanded && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="p-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100 rounded">
              {successMessage}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("titleLabel")}：</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm p-2 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("importanceLabel")}：</label>
            <div className="mt-1">
              <input
                type="range"
                min={1}
                max={10}
                value={importance}
                onChange={(e) => setImportance(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400">{importance}</div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("deadlineLabelOptional")}：</label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm p-2 bg-white dark:bg-gray-800 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("deadlineShortcutsLabel")}</span>
            <div className="flex space-x-2 mt-1">
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
          <button type="submit" className="w-full px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md shadow hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
            {t("addButton")}
          </button>
        </form>
      )}
    </div>
  );
}
