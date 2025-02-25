"use client";

import React, { useEffect, useState } from "react";
import { Task } from "../page";
import CalendarWrapper from "./CalendarWrapper";

// 調整係数・閾値の定数
const ADJUSTMENT_FACTOR = 0.5;
const HIGH_PRIORITY_THRESHOLD = 2;
const MEDIUM_PRIORITY_THRESHOLD = 0.5;

// ユーティリティ関数
const formatDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatRemainingTime = (hours: number): string => {
  if (hours < 24) {
    return `${hours.toFixed(1)}時間`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days}日 ${remHours.toFixed(0)}時間`;
};

// プライオリティラベルコンポーネント
interface PriorityLabelProps {
  priority: number;
}
const PriorityLabel: React.FC<PriorityLabelProps> = ({ priority }) => {
  if (priority >= HIGH_PRIORITY_THRESHOLD) {
    return (
      <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
        高優先度
      </span>
    );
  }
  if (priority > MEDIUM_PRIORITY_THRESHOLD && priority < HIGH_PRIORITY_THRESHOLD) {
    return (
      <span className="bg-yellow-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
        中優先度
      </span>
    );
  }
  return null;
};

// 折りたたみボタン用コンポーネント
interface ToggleButtonProps {
  expanded: boolean;
  onClick: () => void;
  label: string;
}
const ToggleButton: React.FC<ToggleButtonProps> = ({ expanded, onClick, label }) => (
  <button
    onClick={onClick}
    className="flex items-center space-x-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {expanded ? "▲" : "▼"} {label}
  </button>
);

interface InteractiveTaskDashboardProps {
  tasks: Task[];
}

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({ tasks }) => {
  // 現在時刻の更新
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  // UI状態
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showNoDeadlineSection, setShowNoDeadlineSection] = useState(false);
  const [showActiveDeadlineSection, setShowActiveDeadlineSection] = useState(true);
  const [showExpiredSection, setShowExpiredSection] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // タスク処理
  const tasksWithNoDeadline = tasks
    .filter((task) => task.deadline === null)
    .sort((a, b) => b.importance - a.importance);

  const tasksWithDeadline = tasks
    .filter((task) => task.deadline !== null)
    .map((task) => {
      const deadlineDate = new Date(task.deadline as string);
      const diffTime = deadlineDate.getTime() - currentTime.getTime();
      const remainingHours = diffTime > 0 ? diffTime / (1000 * 60 * 60) : 0;
      const priority = task.importance / Math.pow(remainingHours + 1, ADJUSTMENT_FACTOR);
      return { ...task, remainingHours, priority, deadlineDate };
    });

  const activeTasks = tasksWithDeadline
    .filter((task) => task.deadlineDate > currentTime)
    .sort((a, b) => b.priority - a.priority);
  const expiredTasks = tasksWithDeadline
    .filter((task) => task.deadlineDate <= currentTime)
    .sort((a, b) => b.priority - a.priority);

  const tasksForSelectedDate = selectedDate
    ? activeTasks.filter((task) => formatDate(task.deadlineDate) === formatDate(selectedDate))
    : [];

  // タスククリックハンドラ：タスク展開とカレンダー選択
  const handleTaskClick = (deadline: string | null, taskKey: string) => {
    if (!deadline) return;
    setSelectedDate(new Date(deadline.replace(" ", "T")));
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
    <div className="space-y-8">
      {/* 期限なしタスク */}
      <section>
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            期限なしタスク (重要度順)
          </h2>
          <ToggleButton
            expanded={showNoDeadlineSection}
            onClick={() => setShowNoDeadlineSection((prev) => !prev)}
            label={showNoDeadlineSection ? "折りたたむ" : "展開する"}
          />
        </div>
        {showNoDeadlineSection && (
          <ul className="space-y-4">
            {tasksWithNoDeadline.length > 0 ? (
              tasksWithNoDeadline.map((task) => (
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
                      {task.importance >= 9 ? (
                        <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                          高重要度
                        </span>
                      ) : task.importance >= 7 ? (
                        <span className="bg-yellow-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                          中重要度
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-300">期限なしタスクはありません。</p>
            )}
          </ul>
        )}
      </section>

      {/* 期限付き（未完了）タスク */}
      <section>
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            期限付きタスク (未完了・優先度順)
          </h2>
          <ToggleButton
            expanded={showActiveDeadlineSection}
            onClick={() => setShowActiveDeadlineSection((prev) => !prev)}
            label={showActiveDeadlineSection ? "折りたたむ" : "展開する"}
          />
        </div>
        {showActiveDeadlineSection && (
          <ul className="space-y-4">
            {activeTasks.length > 0 ? (
              activeTasks.map((task) => {
                const taskKey = task.title;
                const isExpanded = expandedTasks.has(taskKey);
                return (
                  <li
                    key={taskKey}
                    onClick={() => handleTaskClick(task.deadline, taskKey)}
                    className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                      <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                        {task.title}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span>優先度: {task.priority.toFixed(2)}</span>
                        <PriorityLabel priority={task.priority} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2">
                        <div>
                          <strong>重要度:</strong> {task.importance}
                        </div>
                        <div>
                          <strong>締切:</strong> {task.deadline
                            ? new Date(task.deadline.replace(" ", "T"))
                              .toLocaleString("ja-JP", { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
                            : "期限なし"}
                        </div>
                        <div>
                          <strong>残り時間:</strong> {formatRemainingTime(task.remainingHours)}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                未完了の期限付きタスクはありません。
              </p>
            )}
          </ul>
        )}
      </section>

      {/* 期限切れタスク */}
      <section>
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            期限切れタスク
          </h2>
          <ToggleButton
            expanded={showExpiredSection}
            onClick={() => setShowExpiredSection((prev) => !prev)}
            label={showExpiredSection ? "折りたたむ" : "展開する"}
          />
        </div>
        {showExpiredSection && (
          <ul className="space-y-4">
            {expiredTasks.length > 0 ? (
              expiredTasks.map((task) => {
                const taskKey = task.title;
                const isExpanded = expandedTasks.has(taskKey);
                return (
                  <li
                    key={taskKey}
                    onClick={() => handleTaskClick(task.deadline, taskKey)}
                    className="cursor-pointer bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                      <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                        {task.title}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span>優先度: {task.priority.toFixed(2)}</span>
                        <PriorityLabel priority={task.priority} />
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2">
                        <div>
                          <strong>重要度:</strong> {task.importance}
                        </div>
                        <div>
                          <strong>締切:</strong> {task.deadline ? new Date(task.deadline).toLocaleString('ja-JP') : '期限なし'}
                        </div>
                        <div>
                          <strong>残り時間:</strong> {formatRemainingTime(task.remainingHours)}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <p className="text-gray-600 dark:text-gray-300">期限切れタスクはありません。</p>
            )}
          </ul>
        )}
      </section>

      {/* カレンダー表示 */}
      <section>
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
          カレンダー表示
        </h2>
        <div className="p-6">
          <CalendarWrapper
            tasks={tasks.filter((task) => task.deadline !== null)}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
      </section>

      {/* 選択された日のタスク */}
      <section>
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
          {selectedDate ? `選択された日のタスク (${formatDate(selectedDate)})` : "選択された日のタスク"}
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
