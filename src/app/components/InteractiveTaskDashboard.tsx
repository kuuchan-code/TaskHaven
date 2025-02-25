"use client";

import React, { useEffect, useState } from "react";
import { Task } from "../page";
import CalendarWrapper from "./CalendarWrapper";

// 優先度の計算に使う調整係数
const ADJUSTMENT_FACTOR = 0.5;

// 優先度ラベルの閾値
const HIGH_PRIORITY_THRESHOLD = 2;
const MEDIUM_PRIORITY_THRESHOLD = 0.5;

// 日付を "YYYY-MM-DD" 文字列に変換
const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 残り時間をフォーマット
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
}

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({ tasks }) => {
  // 「現在時刻」を state で管理。これを随時更新することで残り時間を再計算させる
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // タスク展開状態管理用（タスクタイトルをキーにして展開状態を保持）
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // 各セクションの表示・非表示切り替え
  const [showNoDeadlineSection, setShowNoDeadlineSection] = useState(false);
  const [showActiveDeadlineSection, setShowActiveDeadlineSection] = useState(true);
  const [showExpiredSection, setShowExpiredSection] = useState(false);

  // カレンダー選択日
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // currentTime を定期的に更新(例: 1分ごと)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000); // 60秒毎に更新

    return () => clearInterval(timer);
  }, []);

  // 期限なしタスク： importance が高い順にソート
  const tasksWithNoDeadline = tasks
    .filter((task) => task.deadline === null)
    .sort((a, b) => b.importance - a.importance);

  // 期限付きタスク： 各タスクに残り時間と優先度を計算
  const tasksWithDeadline = tasks
    .filter((task) => task.deadline !== null)
    .map((task) => {
      const deadlineDate = new Date(task.deadline as string);
      const diffTime = deadlineDate.getTime() - currentTime.getTime();
      const remainingHours = diffTime > 0 ? diffTime / (1000 * 60 * 60) : 0;
      const priority = task.importance / Math.pow(remainingHours + 1, ADJUSTMENT_FACTOR);
      return {
        ...task,
        remainingHours,
        priority,
        deadlineDate,
      };
    });

  // 期限が未来のタスク（未完了タスク）と、期限が過ぎたタスクに分割
  const activeTasks = tasksWithDeadline.filter((task) => task.deadlineDate > currentTime)
    .sort((a, b) => b.priority - a.priority);
  const expiredTasks = tasksWithDeadline.filter((task) => task.deadlineDate <= currentTime)
    .sort((a, b) => b.priority - a.priority);

  // 選択された日のタスク（active のみ対象）
  const tasksForSelectedDate = selectedDate
    ? activeTasks.filter((task) => formatDate(task.deadlineDate) === formatDate(selectedDate))
    : [];

  // タスククリック時: 日付を選択し、展開状態をトグル
  const handleTaskClick = (deadline: string | null, taskKey: string) => {
    if (!deadline) return;
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

  function PriorityLabel({ priority }: { priority: number }) {
    if (priority >= HIGH_PRIORITY_THRESHOLD) {
      return (
        <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
          高優先度
        </span>
      );
    } else if (priority > MEDIUM_PRIORITY_THRESHOLD && priority < HIGH_PRIORITY_THRESHOLD) {
      return (
        <span className="bg-yellow-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
          中優先度
        </span>
      );
    }
    return null;
  }

  // 折りたたみボタン用のアイコン
  const ToggleButton = ({
    expanded,
    onClick,
    label,
  }: {
    expanded: boolean;
    onClick: () => void;
    label: string;
  }) => (
    <button onClick={onClick} className="text-blue-500 hover:underline flex items-center gap-1">
      {expanded ? "▲" : "▼"} {label}
    </button>
  );

  return (
    <div className="space-y-8">
      {/* 期限なしタスク */}
      <section>
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            期限なしタスク (重要度順)
          </h2>
          <button
            onClick={() => setShowNoDeadlineSection((prev) => !prev)}
            className="flex items-center space-x-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>{showNoDeadlineSection ? "折りたたむ" : "展開する"}</span>
            <span className="text-xl">
              {showNoDeadlineSection ? "▲" : "▼"}
            </span>
          </button>
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
              <p className="text-gray-600 dark:text-gray-300">
                期限なしタスクはありません。
              </p>
            )}
          </ul>
        )}
      </section>

      {/* 未完了（期限付き）タスク */}
      <section>
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            期限付きタスク (未完了・優先度順)
          </h2>
          <button
            onClick={() => setShowActiveDeadlineSection((prev) => !prev)}
            className="flex items-center space-x-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>{showActiveDeadlineSection ? "折りたたむ" : "展開する"}</span>
            <span className="text-xl">
              {showActiveDeadlineSection ? "▲" : "▼"}
            </span>
          </button>
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
                          <strong>締切:</strong> {task.deadline}
                        </div>
                        <div>
                          <strong>残り時間:</strong>{" "}
                          {formatRemainingTime(task.remainingHours)}
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
          <button
            onClick={() => setShowExpiredSection((prev) => !prev)}
            className="flex items-center space-x-2 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>{showExpiredSection ? "折りたたむ" : "展開する"}</span>
            <span className="text-xl">
              {showExpiredSection ? "▲" : "▼"}
            </span>
          </button>
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
                          <strong>締切:</strong> {task.deadline}
                        </div>
                        <div>
                          <strong>残り時間:</strong>{" "}
                          {formatRemainingTime(task.remainingHours)}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })
            ) : (
              <p className="text-gray-600 dark:text-gray-300">
                期限切れタスクはありません。
              </p>
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
