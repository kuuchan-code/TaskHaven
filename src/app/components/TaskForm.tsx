import { useState } from "react";

interface TaskFormProps {
  onTaskAdded: () => void;
  source: string;
}

export default function TaskForm({ onTaskAdded, source }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(1);
  const [deadline, setDeadline] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        importance,
        deadline: deadline ? deadline : null,
        source, // 親から渡された source を利用
      }),
    });
    if (res.ok) {
      onTaskAdded();
      setTitle("");
      setImportance(1);
      setDeadline("");
      setSuccessMessage("タスクが追加されました！");
      // 数秒後にメッセージを消す
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
      {successMessage && (
        <div className="p-2 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">タイトル：</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          重要度：
        </label>
        <div className="mt-1">
          <input
            type="range"
            min={1}
            max={10}
            value={importance}
            onChange={(e) => setImportance(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {importance}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">締切（任意）：</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        {deadline && (
          <button
            type="button"
            onClick={() => setDeadline("")}
            className="mt-3 text-sm text-blue-500 hover:underline block"
          >
            締切をクリア
          </button>
        )}
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        追加
      </button>
    </form>
  );
}
