// src/app/components/InteractiveTaskDashboard.tsx
"use client";

import React, { useState } from "react";
import CalendarWrapper from "./CalendarWrapper";
import { Task } from "../page";

// 日付を "YYYY-MM-DD" に変換するユーティリティ
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

interface InteractiveTaskDashboardProps {
  tasks: Task[];
  tasksWithDeadline: Task[];
  tasksWithoutDeadline: Task[];
}

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({
  tasks,
  tasksWithDeadline,
  tasksWithoutDeadline,
}) => {
  // 日付の選択状態を管理（カレンダーとタスク一覧で共有）
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 選択された日付と一致するタスクを抽出
  const tasksForSelectedDate = selectedDate
    ? tasks.filter((task) => {
        if (task.deadline) {
          const taskDate = new Date(task.deadline.replace(" ", "T"));
          return formatDate(taskDate) === formatDate(selectedDate);
        }
        return false;
      })
    : [];

  // 期限付きタスク一覧でタスクがクリックされた場合、対応する日付を選択
  const handleTaskClick = (deadline: string) => {
    const date = new Date(deadline.replace(" ", "T"));
    setSelectedDate(date);
  };

  return (
    <div>
      {/* 期限なしタスクはそのまま表示 */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
          期限なしタスク (重要度順)
        </h2>
        {tasksWithoutDeadline.length > 0 ? (
          <ul className="space-y-4">
            {tasksWithoutDeadline.map((task) => (
              <li
                key={task.title}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {task.title}
                  </span>
                  <span className="text-base text-gray-600 dark:text-gray-300">
                    重要度: {task.importance}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">期限なしタスクはありません。</p>
        )}
      </section>

      {/* 期限付きタスク一覧（クリックでカレンダーと連動） */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
          期限付きタスク (スコア順)
        </h2>
        {tasksWithDeadline.length > 0 ? (
          <ul className="space-y-4">
            {tasksWithDeadline.map((task) => (
              <li
                key={task.title}
                onClick={() =>
                  task.deadline ? handleTaskClick(task.deadline) : null
                }
                className={`cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${
                  selectedDate &&
                  task.deadline &&
                  formatDate(new Date(task.deadline.replace(" ", "T"))) ===
                    formatDate(selectedDate)
                    ? "ring-2 ring-blue-500"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {task.title}
                  </span>
                  <span className="text-base text-gray-600 dark:text-gray-300">
                    重要度: {task.importance}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">期限付きタスクはありません。</p>
        )}
      </section>

      {/* カレンダー表示（カレンダー側で日付選択すると state を更新） */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
          カレンダー表示
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <CalendarWrapper
            tasks={tasks.filter((task) => task.deadline !== null)}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
      </section>

      {/* 選択された日のタスクを一覧表示（ヘッダーに日付を追加） */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
          {selectedDate
            ? `選択された日のタスク (${formatDate(selectedDate)})`
            : "選択された日のタスク"}
        </h2>
        {selectedDate ? (
          tasksForSelectedDate.length > 0 ? (
            <ul className="space-y-4">
              {tasksForSelectedDate.map((task) => (
                <li
                  key={task.title}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                      {task.title}
                    </span>
                    <span className="text-base text-gray-600 dark:text-gray-300">
                      重要度: {task.importance}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">この日にタスクはありません。</p>
          )
        ) : (
          <p className="text-gray-600 dark:text-gray-300">
            カレンダーまたはタスクをクリックして日付を選択してください。
          </p>
        )}
      </section>
    </div>
  );
};

export default InteractiveTaskDashboard;
