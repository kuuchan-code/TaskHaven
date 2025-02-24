// src/app/components/InteractiveTaskDashboard.tsx
"use client";

import React, { useState } from "react";
import CalendarWrapper from "./CalendarWrapper";
import { Task } from "../page";

const HIGH_PRIORITY_THRESHOLD = 2; // 2以上なら高優先度
const MEDIUM_PRIORITY_THRESHOLD = 0.5; // 1を超え、2未満なら中優先度

// 日付を "YYYY-MM-DD" に変換するユーティリティ
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// 残り時間をフォーマットするユーティリティ
const formatRemainingTime = (hours: number) => {
  if (hours < 24) {
    return `${hours.toFixed(1)}時間`;
  } else {
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}日 ${remHours.toFixed(0)}時間`;
  }
};

interface InteractiveTaskDashboardProps {
  tasks: Task[];
  tasksWithDeadline: (Task & { priority: number; remainingHours: number })[];
  tasksWithoutDeadline: Task[];
}

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({
  tasks,
  tasksWithDeadline,
  tasksWithoutDeadline,
}) => {
  // セクション全体の表示／非表示状態
  const [showNoDeadlineSection, setShowNoDeadlineSection] = useState(false);
  const [showDeadlineSection, setShowDeadlineSection] = useState(true);

  // 選択状態（カレンダーとタスク一覧で共有）
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  // 各タスクの拡張状態を管理（タスクのキーは title で一意と仮定）
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // 選択された日付と一致する期限付きタスクを抽出
  const tasksForSelectedDate = selectedDate
    ? tasksWithDeadline.filter((task) => {
      const taskDate = new Date(task.deadline!.replace(" ", "T"));
      return formatDate(taskDate) === formatDate(selectedDate);
    })
    : [];

  // タスククリック時：選択日を更新し、拡張状態をトグル
  const handleTaskClick = (deadline: string, taskKey: string) => {
    const date = new Date(deadline.replace(" ", "T"));
    setSelectedDate(date);
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskKey)) {
        newSet.delete(taskKey);
      } else {
        newSet.add(taskKey);
      }
      return newSet;
    });
  };

  return (
    <div>
      {/* 期限なしタスク */}
      <section className="mb-12">
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            期限なしタスク (重要度順)
          </h2>
          <button
            onClick={() => setShowNoDeadlineSection((prev) => !prev)}
            className="text-blue-500 hover:underline"
          >
            {showNoDeadlineSection ? "折りたたむ" : "展開する"}
          </button>
        </div>
        {showNoDeadlineSection && (
          <>
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
                      <div className="flex items-center space-x-4">
                        <span className="text-base text-gray-600 dark:text-gray-300">
                          重要度: {task.importance}
                        </span>
                        {task.importance === 10 || task.importance === 9 ? (
                          <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                            高重要度
                          </span>
                        ) : task.importance === 8 || task.importance === 7 ? (
                          <span className="bg-yellow-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                            中重要度
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                期限なしタスクはありません。
              </p>
            )}
          </>
        )}
      </section>

      {/* 期限付きタスク */}
      <section className="mb-12">
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            期限付きタスク (優先度順)
          </h2>
          <button
            onClick={() => setShowDeadlineSection((prev) => !prev)}
            className="text-blue-500 hover:underline"
          >
            {showDeadlineSection ? "折りたたむ" : "展開する"}
          </button>
        </div>
        {showDeadlineSection && (
          <>
            {tasksWithDeadline.length > 0 ? (
              <ul className="space-y-4">
                {tasksWithDeadline.map((task) => {
                  const taskKey = task.title; // タイトルをキーとして使用（ユニークであると仮定）
                  const selected =
                    selectedDate &&
                    task.deadline &&
                    formatDate(new Date(task.deadline.replace(" ", "T"))) ===
                    formatDate(selectedDate);
                  const isExpanded = expandedTasks.has(taskKey);
                  return (
                    <li
                      key={taskKey}
                      onClick={() =>
                        task.deadline
                          ? handleTaskClick(task.deadline, taskKey)
                          : null
                      }
                      className={`cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${selected ? "ring-2 ring-blue-500" : ""
                        }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-center">
                        <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                          {task.title}
                        </span>
                        <div className="flex items-center space-x-4">
                          <span className="text-base text-gray-600 dark:text-gray-300">
                            優先度: {task.priority.toFixed(2)}
                          </span>
                          <span className="text-base text-gray-600 dark:text-gray-300">
                            残り: {formatRemainingTime(task.remainingHours)}
                          </span>
                          {task.priority >= HIGH_PRIORITY_THRESHOLD ? (
                            <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                              高優先度
                            </span>
                          ) : task.priority > MEDIUM_PRIORITY_THRESHOLD &&
                            task.priority < HIGH_PRIORITY_THRESHOLD ? (
                            <span className="bg-yellow-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                              中優先度
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2">
                          <div>
                            <strong>重要度:</strong> {task.importance}
                          </div>
                          <div>
                            <strong>締切:</strong> {task.deadline}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                期限付きタスクはありません。
              </p>
            )}
          </>
        )}
      </section>

      {/* カレンダー表示 */}
      <section className="mb-12">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
          カレンダー表示
        </h2>
        <div className="dark:bg-gray-800 p-6">
          <CalendarWrapper
            tasks={tasks.filter((task) => task.deadline !== null)}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
      </section>

      {/* 選択された日のタスク一覧 */}
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
                    <div className="flex items-center space-x-4">
                      <span className="text-base text-gray-600 dark:text-gray-300">
                        優先度: {task.priority.toFixed(2)}
                      </span>
                      <span className="text-base text-gray-600 dark:text-gray-300">
                        残り: {formatRemainingTime(task.remainingHours)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">
              この日にタスクはありません。
            </p>
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
