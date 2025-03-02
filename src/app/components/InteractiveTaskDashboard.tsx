"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatForDatetimeLocal, convertLocalToIsoWithOffset, getRelativeDeadline } from "../utils/dateUtils";
import { buttonClasses, sectionHeaderClasses } from "../utils/designUtils";

export type Task = {
  completed: boolean;
  id: number;
  title: string;
  importance: number;
  deadline: string | null;
  priority?: number;
  completed_at?: string;
};

// importance と deadline から優先度を計算する関数
const calculatePriority = (importance: number, deadline: string | null): number => {
  if (!deadline) return importance;

  const deadlineDate = new Date(deadline);
  // 現在時刻との差を時間単位で計算
  const diffTime = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);

  // 期限がまだ先の場合は、importance を (diffTime + 1) の平方根で割る
  // 期限が過ぎている場合は importance をそのまま返す
  return diffTime >= 0 ? importance / Math.pow(diffTime + 1, 0.5) : importance;
};

const formatRemainingTime = (hours: number): string => {
  if (hours < 24) {
    return `${hours.toFixed(1)} ${hours < 2 ? "hour" : "hours"}`;
  }
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days} ${days === 1 ? "day" : "days"} ${remHours.toFixed(0)} ${remHours === 1 ? "hour" : "hours"}`;
};

interface PriorityLabelProps {
  priority: number;
}
const PriorityLabel: React.FC<PriorityLabelProps> = ({ priority }) => {
  const t = useTranslations("TaskDashboard");
  if (priority >= 2) {
    return (
      <span className="bg-red-600 dark:bg-red-800 text-white text-xs font-bold rounded-full px-2 py-0.5">
        {t("highPriorityLabel")}
      </span>
    );
  }
  if (priority > 0.64 && priority < 2) {
    return (
      <span className="bg-yellow-500 dark:bg-yellow-700 text-white text-xs font-bold rounded-full px-2 py-0.5">
        {t("mediumPriorityLabel")}
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
    className="flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-md px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    {expanded ? "▲" : "▼"} {label}
  </button>
);

interface DeadlineShortcutsProps {
  setDeadline: (deadline: string) => void;
}
const DeadlineShortcuts: React.FC<DeadlineShortcutsProps> = ({ setDeadline }) => {
  const t = useTranslations("TaskDashboard");
  const shortcuts = [
    { key: "shortcut1Hour", hours: 1 },
    { key: "shortcut3Hours", hours: 3 },
    { key: "shortcut1Day", hours: 24 },
    { key: "shortcut3Days", hours: 72 },
    { key: "shortcut1Week", hours: 168 },
  ];
  return (
    <div className="mt-2">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t("deadlineShortcutsLabel")}
      </span>
      <div className="flex flex-wrap gap-2 mt-1">
        {shortcuts.map(({ key, hours }) => (
          <button
            key={hours}
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(hours))}
            className="px-2 py-1 bg-gray-300 dark:bg-gray-700 text-sm rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
          >
            {t(key)}
          </button>
        ))}
      </div>
    </div>
  );
};

interface TaskEditorProps {
  editingTitle: string;
  editingImportance: number;
  editingDeadline: string | null;
  setEditingTitle: (title: string) => void;
  setEditingImportance: (importance: number) => void;
  setEditingDeadline: (deadline: string) => void;
  onSave: () => void;
  onCancel: () => void;
}
const TaskEditor: React.FC<TaskEditorProps> = ({
  editingTitle,
  editingImportance,
  editingDeadline,
  setEditingTitle,
  setEditingImportance,
  setEditingDeadline,
  onSave,
  onCancel,
}) => {
  const t = useTranslations("TaskDashboard");
  return (
    <div className="space-y-4 p-4 bg-gray-200 dark:bg-gray-800 rounded-md shadow-inner">
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
          {t("titleLabel")}:
        </label>
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm p-2 bg-white dark:bg-gray-700 dark:text-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
          {t("importanceLabel")}: {editingImportance}
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={editingImportance}
          onChange={(e) => setEditingImportance(Number(e.target.value))}
          className="mt-1 w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
          {t("deadlineLabel")}:
        </label>
        <input
          type="datetime-local"
          value={editingDeadline || ""}
          onChange={(e) => setEditingDeadline(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm p-2 bg-white dark:bg-gray-700 dark:text-gray-100"
        />
        <DeadlineShortcuts setDeadline={setEditingDeadline} />
      </div>
      <div className="flex justify-end space-x-3">
        <button onClick={onSave} className={buttonClasses}>
          {t("save")}
        </button>
        <button onClick={onCancel} className="w-full px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded-md shadow hover:bg-gray-600 dark:hover:bg-gray-700 transition-colors">
          {t("cancel")}
        </button>
      </div>
    </div>
  );
};

interface TaskItemProps {
  task: Task & { timeDiff?: number };
  isEditing: boolean;
  onStartEditing: () => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onReopen: () => void;
  editingTitle: string;
  editingImportance: number;
  editingDeadline: string | null;
  setEditingTitle: (title: string) => void;
  setEditingImportance: (importance: number) => void;
  setEditingDeadline: (deadline: string) => void;
}
const TaskItem: React.FC<TaskItemProps> = ({
  task,
  isEditing,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onComplete,
  onDelete,
  onReopen,
  editingTitle,
  editingImportance,
  editingDeadline,
  setEditingTitle,
  setEditingImportance,
  setEditingDeadline,
}) => {
  const t = useTranslations("TaskDashboard");
  const [showDetails, setShowDetails] = useState(false);
  const displayDeadline = task.deadline ? new Date(task.deadline).toLocaleString() : t("noDeadline");

  return (
    <li
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => setShowDetails((prev) => !prev)}
    >
      <div className="flex justify-between items-center">
        <span className={`text-xl font-semibold ${task.completed ? "line-through" : ""} text-gray-900 dark:text-gray-100`}>
          {task.title}
        </span>
        {typeof task.priority === "number" ? (
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("priorityText", { value: task.priority.toFixed(2) })}
            </span>
            <PriorityLabel priority={task.priority} />
            {task.deadline && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {(() => {
                  const deadlineDate = new Date(task.deadline);
                  const diffTime = (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                  return diffTime >= 0
                    ? `${t("remaining")} ${formatRemainingTime(diffTime)}`
                    : `${t("overdue")} ${formatRemainingTime(-diffTime)}`;
                })()}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t("importanceText", { value: task.importance })}
            </span>
            {task.importance >= 9 ? (
              <span className="bg-red-600 dark:bg-red-800 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {t("highImportanceLabel")}
              </span>
            ) : task.importance >= 7 ? (
              <span className="bg-yellow-500 dark:bg-yellow-700 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {t("mediumImportanceLabel")}
              </span>
            ) : null}
          </div>
        )}
      </div>
      {showDetails && (
        <>
          {isEditing ? (
            <div className="mt-4" onClick={(e) => e.stopPropagation()}>
              <TaskEditor
                editingTitle={editingTitle}
                editingImportance={editingImportance}
                editingDeadline={editingDeadline}
                setEditingTitle={setEditingTitle}
                setEditingImportance={setEditingImportance}
                setEditingDeadline={setEditingDeadline}
                onSave={onSaveEditing}
                onCancel={onCancelEditing}
              />
            </div>
          ) : (
            <div className="mt-4 border-t border-gray-300 dark:border-gray-700 pt-3" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-2">
                <div>
                  <strong className="text-sm text-gray-800 dark:text-gray-200">{t("importanceLabel")}:</strong>{" "}
                  <span className="text-sm text-gray-700 dark:text-gray-300">{task.importance}</span>
                </div>
                <div>
                  <strong className="text-sm text-gray-800 dark:text-gray-200">{t("deadlineLabel")}:</strong>{" "}
                  <span className="text-sm text-gray-700 dark:text-gray-300">{displayDeadline}</span>
                </div>
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartEditing();
                    }}
                    className={buttonClasses}
                  >
                    {t("edit")}
                  </button>
                  {task.completed ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReopen();
                      }}
                      className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm"
                    >
                      {t("reopen")}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onComplete();
                      }}
                      className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm"
                    >
                      {t("complete")}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="w-full px-4 py-2 bg-red-600 dark:bg-red-800 text-white rounded-md shadow hover:bg-red-700 dark:hover:bg-red-900 transition-colors text-sm"
                  >
                    {t("delete")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </li>
  );
};

interface InteractiveTaskDashboardProps {
  tasks: Task[];
  refreshTasks: () => void;
  username: string;
}

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({ tasks, refreshTasks, username }) => {
  const t = useTranslations("TaskDashboard");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showNoDeadlineSection, setShowNoDeadlineSection] = useState(false);
  const [showDeadlineSection, setShowDeadlineSection] = useState(true);
  const [showCompletedSection, setShowCompletedSection] = useState(false);

  // 編集状態の管理
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingImportance, setEditingImportance] = useState(1);
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (window.location.hash === "#deadline-tasks") {
      const element = document.getElementById("deadline-tasks");
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // 期限なしタスクは importance をそのまま優先度として扱う
  const tasksWithNoDeadlineActive = tasks
    .filter(task => task.deadline === null && !task.completed)
    .map(task => ({ ...task, priority: task.importance }))
    .sort((a, b) => b.priority - a.priority);

  // 期限付きタスクは deadline と importance から priority を計算する
  const tasksWithDeadlineActive = tasks
    .filter(task => task.deadline !== null && !task.completed)
    .map(task => ({
      ...task,
      timeDiff: (new Date(task.deadline!).getTime() - currentTime.getTime()) / (1000 * 60 * 60),
      priority: calculatePriority(task.importance, task.deadline),
    }))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const completedTasks = tasks.filter(task => task.completed);

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTitle(task.title);
    setEditingImportance(task.importance);
    setEditingDeadline(task.deadline ? formatForDatetimeLocal(task.deadline) : null);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditingTitle("");
    setEditingImportance(1);
    setEditingDeadline(null);
  };

  const saveEditing = async (taskId: number) => {
    let deadlineToSave: string | null = editingDeadline;
    if (deadlineToSave && deadlineToSave !== "") {
      deadlineToSave = convertLocalToIsoWithOffset(deadlineToSave);
    } else {
      deadlineToSave = null;
    }
    const fcmToken = localStorage.getItem("fcmToken");
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: taskId,
        title: editingTitle,
        importance: editingImportance,
        deadline: deadlineToSave,
        username,
        fcmToken,
      }),
    });
    if (res.ok) {
      cancelEditing();
      refreshTasks();
    }
  };

  const deleteTask = async (taskId: number) => {
    if (confirm(t("confirmDelete"))) {
      const res = await fetch("/api/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, username }),
      });
      if (res.ok) refreshTasks();
    }
  };

  const completeTask = async (taskId: number) => {
    if (confirm(t("confirmComplete"))) {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, completed: true, username }),
      });
      if (res.ok) refreshTasks();
    }
  };

  const reopenTask = async (taskId: number) => {
    if (confirm(t("confirmReopen"))) {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, completed: false, username }),
      });
      if (res.ok) refreshTasks();
    }
  };

  const renderTaskList = (taskList: (Task & { timeDiff?: number })[], completedSection: boolean = false) => (
    <ul className="space-y-4">
      {taskList.length > 0 ? (
        taskList.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            isEditing={editingTaskId === task.id}
            onStartEditing={() => startEditing(task)}
            onSaveEditing={() => saveEditing(task.id)}
            onCancelEditing={cancelEditing}
            onComplete={() => completeTask(task.id)}
            onDelete={() => deleteTask(task.id)}
            onReopen={() => reopenTask(task.id)}
            editingTitle={editingTitle}
            editingImportance={editingImportance}
            editingDeadline={editingDeadline}
            setEditingTitle={setEditingTitle}
            setEditingImportance={setEditingImportance}
            setEditingDeadline={setEditingDeadline}
          />
        ))
      ) : (
        <p className="text-gray-600 dark:text-gray-400">
          {completedSection ? t("noCompletedTasks") : t("noTasks")}
        </p>
      )}
    </ul>
  );

  return (
    <div className="space-y-12">
      <section id="deadline-tasks" className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-3 mb-4">
          <h2 className={sectionHeaderClasses}>{t("deadlineTasks")}</h2>
          <ToggleButton
            expanded={showDeadlineSection}
            onClick={() => setShowDeadlineSection(prev => !prev)}
            label={showDeadlineSection ? t("collapse") : t("expand")}
          />
        </div>
        {showDeadlineSection && renderTaskList(tasksWithDeadlineActive)}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-3 mb-4">
          <h2 className={sectionHeaderClasses}>{t("noDeadlineTasks")}</h2>
          <ToggleButton
            expanded={showNoDeadlineSection}
            onClick={() => setShowNoDeadlineSection(prev => !prev)}
            label={showNoDeadlineSection ? t("collapse") : t("expand")}
          />
        </div>
        {showNoDeadlineSection && renderTaskList(tasksWithNoDeadlineActive)}
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-3 mb-4">
          <h2 className={sectionHeaderClasses}>{t("completedTasks")}</h2>
          <ToggleButton
            expanded={showCompletedSection}
            onClick={() => setShowCompletedSection(prev => !prev)}
            label={showCompletedSection ? t("collapse") : t("expand")}
          />
        </div>
        {showCompletedSection && renderTaskList(completedTasks, true)}
      </section>
    </div>
  );
};

export default InteractiveTaskDashboard;
export const runtime = "edge";
