// src/app/components/TaskForm.tsx
"use client";
import { useState } from "react";

interface TaskFormProps {
  onTaskAdded: () => void;
}

export default function TaskForm({ onTaskAdded }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [importance, setImportance] = useState(1);
  const [deadline, setDeadline] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        importance,
        deadline: deadline ? deadline : null,
      }),
    });
    if (res.ok) {
      onTaskAdded();
      setTitle("");
      setImportance(1);
      setDeadline("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
      <div>
        <label className="block text-sm font-medium text-gray-700">タイトル：</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">重要度：</label>
        <input
          type="number"
          value={importance}
          onChange={(e) => setImportance(Number(e.target.value))}
          min={1}
          max={10}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">締切（任意）：</label>
        <input
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        追加
      </button>
    </form>
  );
}
