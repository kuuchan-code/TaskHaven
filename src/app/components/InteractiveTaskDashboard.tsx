// src/app/components/InteractiveTaskDashboard.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Task } from "../page";
import CalendarWrapper from "./CalendarWrapper";

const ADJUSTMENT_FACTOR = 0.5;
const HIGH_PRIORITY_THRESHOLD = 2;
const MEDIUM_PRIORITY_THRESHOLD = 0.5;

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
  refreshTasks: () => void;
  source: string;
}

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({ tasks, refreshTasks, source }) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [showNoDeadlineSection, setShowNoDeadlineSection] = useState(false);
  const [showActiveDeadlineSection, setShowActiveDeadlineSection] = useState(true);
  const [showExpiredSection, setShowExpiredSection] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 編集用ステート
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingImportance, setEditingImportance] = useState(1);
  const [editingDeadline, setEditingDeadline] = useState("");

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

  // タスククリック時、期限があればカレンダー選択も行い、ない場合は展開のみ
  const handleTaskClick = (deadline: string | null, taskId: number) => {
    if (deadline) {
      setSelectedDate(new Date(deadline.replace(" ", "T")));
    }
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingImportance(task.importance);
    if (task.deadline) {
      // Dateオブジェクトに変換後、datetime-local入力欄用に整形
      const date = new Date(task.deadline);
      setEditingDeadline(date.toISOString().slice(0, 16));
    } else {
      setEditingDeadline("");
    }
  };
  

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTitle("");
    setEditingImportance(1);
    setEditingDeadline("");
  };

  const saveEditing = async (taskId: number) => {
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: taskId,
        title: editingTitle,
        importance: editingImportance,
        deadline: editingDeadline ? editingDeadline : null,
        source,
      }),
    });
    if (res.ok) {
      cancelEditing();
      refreshTasks();
    }
  };

  const deleteTask = async (taskId: number) => {
    if (confirm("本当に削除しますか？")) {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, source }),
      });
      if (res.ok) {
        refreshTasks();
      }
    }
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
                  key={task.id}
                  onClick={() => handleTaskClick(task.deadline, task.id)}
                  className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
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
                  {expandedTasks.has(task.id) && (
                    <div
                      className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {editingTaskId === task.id ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium">タイトル:</label>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">重要度:</label>
                            <input
                              type="number"
                              value={editingImportance}
                              onChange={(e) => setEditingImportance(Number(e.target.value))}
                              min={1}
                              max={10}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">締切:</label>
                            <input
                              type="datetime-local"
                              value={editingDeadline}
                              onChange={(e) => setEditingDeadline(e.target.value)}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => saveEditing(task.id)} className="px-3 py-1 bg-green-500 text-white rounded">
                              保存
                            </button>
                            <button onClick={cancelEditing} className="px-3 py-1 bg-gray-500 text-white rounded">
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div>
                            <strong>重要度:</strong> {task.importance}
                          </div>
                          <div>
                            <strong>締切:</strong> 期限なし
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(task);
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded"
                            >
                              編集
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTask(task.id);
                              }}
                              className="px-3 py-1 bg-red-500 text-white rounded"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                const taskId = task.id;
                const isExpanded = expandedTasks.has(taskId);
                return (
                  <li
                    key={taskId}
                    onClick={() => handleTaskClick(task.deadline, taskId)}
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
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2" onClick={(e) => e.stopPropagation()}>
                        {editingTaskId === taskId ? (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium">タイトル:</label>
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium">重要度:</label>
                              <input
                                type="number"
                                value={editingImportance}
                                onChange={(e) => setEditingImportance(Number(e.target.value))}
                                min={1}
                                max={10}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium">締切:</label>
                              <input
                                type="datetime-local"
                                value={editingDeadline}
                                onChange={(e) => setEditingDeadline(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => saveEditing(taskId)} className="px-3 py-1 bg-green-500 text-white rounded">
                                保存
                              </button>
                              <button onClick={cancelEditing} className="px-3 py-1 bg-gray-500 text-white rounded">
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <strong>重要度:</strong> {task.importance}
                            </div>
                            <div>
                              <strong>締切:</strong>{" "}
                              {task.deadline
                                ? new Date(task.deadline.replace(" ", "T")).toLocaleString("ja-JP", {
                                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                  })
                                : "期限なし"}
                            </div>
                            <div>
                              <strong>残り時間:</strong> {formatRemainingTime(task.remainingHours)}
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(task);
                                }}
                                className="px-3 py-1 bg-green-500 text-white rounded"
                              >
                                編集
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(taskId);
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded"
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        )}
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
                const taskId = task.id;
                const isExpanded = expandedTasks.has(taskId);
                return (
                  <li
                    key={taskId}
                    onClick={() => handleTaskClick(task.deadline, taskId)}
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
                      <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2" onClick={(e) => e.stopPropagation()}>
                        {editingTaskId === taskId ? (
                          <div className="space-y-2">
                            <div>
                              <label className="block text-sm font-medium">タイトル:</label>
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium">重要度:</label>
                              <input
                                type="number"
                                value={editingImportance}
                                onChange={(e) => setEditingImportance(Number(e.target.value))}
                                min={1}
                                max={10}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium">締切:</label>
                              <input
                                type="datetime-local"
                                value={editingDeadline}
                                onChange={(e) => setEditingDeadline(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <button onClick={() => saveEditing(taskId)} className="px-3 py-1 bg-green-500 text-white rounded">
                                保存
                              </button>
                              <button onClick={cancelEditing} className="px-3 py-1 bg-gray-500 text-white rounded">
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div>
                              <strong>重要度:</strong> {task.importance}
                            </div>
                            <div>
                              <strong>締切:</strong> {task.deadline ? new Date(task.deadline).toLocaleString('ja-JP') : '期限なし'}
                            </div>
                            <div>
                              <strong>残り時間:</strong> {formatRemainingTime(task.remainingHours)}
                            </div>
                            <div className="flex space-x-2 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(task);
                                }}
                                className="px-3 py-1 bg-green-500 text-white rounded"
                              >
                                編集
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTask(taskId);
                                }}
                                className="px-3 py-1 bg-red-500 text-white rounded"
                              >
                                削除
                              </button>
                            </div>
                          </div>
                        )}
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
                  key={task.id}
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
