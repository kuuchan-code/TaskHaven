import { useState } from "react";

interface TaskFormProps {
  onTaskAdded: () => void;
  source: string;
}

// ローカル日時をタイムゾーン付きISO形式に変換する関数
const convertLocalToIsoWithOffset = (localDateString: string): string => {
  const localDate = new Date(localDateString);
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = localDate.getFullYear();
  const month = pad(localDate.getMonth() + 1);
  const day = pad(localDate.getDate());
  const hours = pad(localDate.getHours());
  const minutes = pad(localDate.getMinutes());
  const seconds = pad(localDate.getSeconds());
  // getTimezoneOffset は分単位。ここではオフセットの符号を反転して利用
  const timezoneOffset = -localDate.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? "+" : "-";
  const offsetHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
  const offsetMinutes = pad(Math.abs(timezoneOffset) % 60);
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
};

export default function TaskForm({ onTaskAdded, source }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(1);
  const [deadline, setDeadline] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 相対的な締切日時を datetime-local 用フォーマットで取得するヘルパー関数
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

    // deadline が入力されていれば、タイムゾーン付きのISO形式に変換
    const deadlineToSend = deadline ? convertLocalToIsoWithOffset(deadline) : null;

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        importance,
        deadline: deadlineToSend,
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">重要度：</label>
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
      </div>
      {/* 相対的な締切日時を選択できるショートカット */}
      <div>
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">ショートカット締切：</span>
        <div className="flex space-x-2 mt-1">
          <button
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(1))}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded"
          >
            1時間後
          </button>
          <button
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(3))}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded"
          >
            3時間後
          </button>
          <button
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(24))}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded"
          >
            1日後
          </button>
          <button
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(72))}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded"
          >
            3日後
          </button>
          <button
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(168))}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded"
          >
            1週間後
          </button>
        </div>
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
