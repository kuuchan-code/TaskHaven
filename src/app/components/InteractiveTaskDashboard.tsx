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
  const [showDeadlineSection, setShowDeadlineSection] = useState(true);
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 編集用ステート
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingImportance, setEditingImportance] = useState(1);
  const [editingDeadline, setEditingDeadline] = useState("");

  // 未完了タスク（active）
  const tasksWithNoDeadlineActive = tasks
    .filter((task) => task.deadline === null && !task.completed)
    .sort((a, b) => b.importance - a.importance);

  const tasksWithDeadlineActive = tasks
    .filter((task) => task.deadline !== null && !task.completed)
    .map((task) => {
      const deadlineDate = new Date(task.deadline as string);
      const diffTime = deadlineDate.getTime() - currentTime.getTime();
      const timeDiff = diffTime / (1000 * 60 * 60); // 正: 残り時間, 負: 超過時間
      const priority =
        timeDiff >= 0
          ? task.importance / Math.pow(timeDiff + 1, ADJUSTMENT_FACTOR)
          : task.importance * (1 + Math.abs(timeDiff) / 10);
      return { ...task, timeDiff, priority, deadlineDate };
    })
    .sort((a, b) => b.priority - a.priority);

  // 完了済みタスク（期限有無に関わらず）
  const completedTasks = tasks.filter((task) => task.completed);

  const tasksForSelectedDate = selectedDate
    ? tasksWithDeadlineActive.filter((task) => formatDate(task.deadlineDate) === formatDate(selectedDate))
    : [];

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

  // タスクを完了状態に更新する関数
  const completeTask = async (taskId: number) => {
    if (confirm("このタスクを完了にしますか？")) {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          completed: true,
          source,
        }),
      });
      if (res.ok) {
        refreshTasks();
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* 期限なしタスク（未完了） */}
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
            {tasksWithNoDeadlineActive.length > 0 ? (
              tasksWithNoDeadlineActive.map((task) => (
                <li
                  key={task.id}
                  onClick={() => handleTaskClick(task.deadline, task.id)}
                  className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xl font-medium ${task.completed ? "line-through" : ""} text-gray-900 dark:text-gray-100`}>
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
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2" onClick={(e) => e.stopPropagation()}>
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
                            <label className="block text-sm font-medium">重要度: {editingImportance}</label>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={editingImportance}
                              onChange={(e) => setEditingImportance(Number(e.target.value))}
                              className="mt-1 block w-full"
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
                                completeTask(task.id);
                              }}
                              className="px-3 py-1 bg-blue-500 text-white rounded"
                            >
                              完了
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

      {/* 期限付きタスク（未完了） */}
      <section>
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            期限付きタスク (優先度順)
          </h2>
          <ToggleButton
            expanded={showDeadlineSection}
            onClick={() => setShowDeadlineSection((prev) => !prev)}
            label={showDeadlineSection ? "折りたたむ" : "展開する"}
          />
        </div>
        {showDeadlineSection && (
          <ul className="space-y-4">
            {tasksWithDeadlineActive.length > 0 ? (
              tasksWithDeadlineActive.map((task) => {
                const taskId = task.id;
                const isExpanded = expandedTasks.has(taskId);
                return (
                  <li
                    key={taskId}
                    onClick={() => handleTaskClick(task.deadline, taskId)}
                    className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-center">
                      <span className={`text-xl font-medium ${task.completed ? "line-through" : ""} text-gray-900 dark:text-gray-100`}>
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
                              <label className="block text-sm font-medium">重要度: {editingImportance}</label>
                              <input
                                type="range"
                                min={1}
                                max={10}
                                value={editingImportance}
                                onChange={(e) => setEditingImportance(Number(e.target.value))}
                                className="mt-1 block w-full"
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
                                  completeTask(task.id);
                                }}
                                className="px-3 py-1 bg-blue-500 text-white rounded"
                              >
                                完了
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
                );
              })
            ) : (
              <p className="text-gray-600 dark:text-gray-300">期限付きタスクはありません。</p>
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
                    <span className={`text-xl font-medium ${task.completed ? "line-through" : ""} text-gray-900 dark:text-gray-100`}>
                      {task.title}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-base text-gray-600 dark:text-gray-300">
                        優先度: {task.priority.toFixed(2)}
                      </span>
                      <span className="text-base text-gray-600 dark:text-gray-300">
                        {task.timeDiff >= 0
                          ? `残り: ${formatRemainingTime(task.timeDiff)}`
                          : `超過: ${formatRemainingTime(-task.timeDiff)}`}
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

      {/* 完了済みタスク（編集・削除可能：展開できるよう onClick を追加） */}
      <section>
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            完了済みタスク
          </h2>
          <ToggleButton
            expanded={showCompletedSection}
            onClick={() => setShowCompletedSection((prev) => !prev)}
            label={showCompletedSection ? "折りたたむ" : "展開する"}
          />
        </div>
        {showCompletedSection && (
          <ul className="space-y-4">
            {completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <li
                  key={task.id}
                  onClick={() => handleTaskClick(task.deadline, task.id)}
                  className="cursor-pointer bg-gray-200 dark:bg-gray-700 rounded-lg shadow p-6 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xl font-medium line-through text-gray-900 dark:text-gray-100`}>
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
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2" onClick={(e) => e.stopPropagation()}>
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
                            <label className="block text-sm font-medium">重要度: {editingImportance}</label>
                            <input
                              type="range"
                              min={1}
                              max={10}
                              value={editingImportance}
                              onChange={(e) => setEditingImportance(Number(e.target.value))}
                              className="mt-1 block w-full"
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
                            <strong>締切:</strong>{" "}
                            {task.deadline
                              ? new Date(task.deadline.replace(" ", "T")).toLocaleString("ja-JP", {
                                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                })
                              : "期限なし"}
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
              <p className="text-gray-600 dark:text-gray-300">完了済みタスクはありません。</p>
            )}
          </ul>
        )}
      </section>
    </div>
  );
};

export default InteractiveTaskDashboard;
