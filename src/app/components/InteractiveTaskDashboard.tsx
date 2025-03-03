"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  formatForDatetimeLocal,
  convertLocalToIsoWithOffset,
  getRelativeDeadline
} from "../utils/dateUtils";
import { buttonClasses, sectionHeaderClasses } from "../utils/designUtils";
import { Task } from "../types/taskTypes";

// ユーティリティ関数
// ---------------------------------------------------------
const calculatePriority = (importance: number, deadline: string | null): number => {
  if (!deadline) return importance;
  const deadlineDate = new Date(deadline);
  const diffTime = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
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

// カスタムフック
// ---------------------------------------------------------
interface TaskEditorState {
  editingTaskId: number | null;
  editingTitle: string;
  editingImportance: number;
  editingDeadline: string | null;
  startEditing: (task: Task) => void;
  cancelEditing: () => void;
  saveEditing: (taskId: number) => Promise<void>;
  setEditingTitle: (title: string) => void;
  setEditingImportance: (importance: number) => void;
  setEditingDeadline: (deadline: string) => void;
}

const useTaskEditor = (refreshTasks: () => void, username: string): TaskEditorState => {
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingImportance, setEditingImportance] = useState(1);
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null);

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

  return {
    editingTaskId,
    editingTitle, 
    editingImportance, 
    editingDeadline,
    startEditing,
    cancelEditing,
    saveEditing,
    setEditingTitle,
    setEditingImportance,
    setEditingDeadline,
  };
};

interface TaskOperations {
  completeTask: (taskId: number) => Promise<void>;
  reopenTask: (taskId: number) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
}

const useTaskOperations = (refreshTasks: () => void, username: string): TaskOperations => {
  const t = useTranslations("TaskDashboard");

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

  return { deleteTask, completeTask, reopenTask };
};

const useTaskSorting = (tasks: Task[], currentTime: Date) => {
  // 期限なしタスクは重要度（importance）のみで管理（優先度プロパティは付与しない）
  const tasksWithNoDeadlineActive = tasks
    .filter(task => task.deadline === null && !task.completed)
    .sort((a, b) => b.importance - a.importance);

  // 期限付きタスクは importance と deadline から優先度（priority）を計算する（未完了のみ）
  const tasksWithDeadlineActive = tasks
    .filter(task => task.deadline !== null && !task.completed)
    .map(task => ({
      ...task,
      timeDiff: (new Date(task.deadline!).getTime() - currentTime.getTime()) / (1000 * 60 * 60),
      priority: calculatePriority(task.importance, task.deadline),
    }))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  const completedTasks = tasks.filter(task => task.completed);

  return { tasksWithNoDeadlineActive, tasksWithDeadlineActive, completedTasks };
};

// コンポーネント
// ---------------------------------------------------------
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

interface TaskHeaderProps {
  task: Task & { timeDiff?: number };
}

const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => {
  const t = useTranslations("TaskDashboard");
  
  // 完了済みタスクの場合は、優先度は重要度そのものにする
  const computedPriority = task.deadline
    ? calculatePriority(task.importance, task.deadline)
    : task.importance;
    
  if (task.completed) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("importanceText", { value: task.importance })}
        </span>
        {task.deadline && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("deadlineLabel")} {new Date(task.deadline).toLocaleString()}
          </span>
        )}
        {task.completed_at && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("completedAtLabel", { defaultValue: "Completed at:" })}{" "}
            {new Date(task.completed_at).toLocaleString()}
          </span>
        )}
      </div>
    );
  } 
  
  if (task.deadline) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("priorityText", { value: task.priority?.toFixed(2) })}
        </span>
        <PriorityLabel priority={task.priority!} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {(() => {
            const deadlineDate = new Date(task.deadline!);
            const diffTime = (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
            return diffTime >= 0
              ? `${t("remaining")} ${formatRemainingTime(diffTime)}`
              : `${t("overdue")} ${formatRemainingTime(-diffTime)}`;
          })()}
        </span>
      </div>
    );
  }
  
  return (
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
  );
};

interface TaskDetailsProps {
  task: Task;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onReopen: () => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({ 
  task, 
  onEdit, 
  onComplete, 
  onDelete, 
  onReopen 
}) => {
  const t = useTranslations("TaskDashboard");
  const displayDeadline = task.deadline
    ? new Date(task.deadline).toLocaleString()
    : t("noDeadline");
  const computedPriority = task.deadline
    ? calculatePriority(task.importance, task.deadline)
    : task.importance;
    
  return (
    <div className="mt-4 border-t border-gray-300 dark:border-gray-700 pt-3">
      <div className="space-y-2">
        {task.completed ? (
          <>
            <div>
              <strong className="text-sm text-gray-800 dark:text-gray-200">
                {t("importanceLabel")}:
              </strong>{" "}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {task.importance}
              </span>
            </div>
            {task.deadline && (
              <div>
                <strong className="text-sm text-gray-800 dark:text-gray-200">
                  {t("deadlineLabel")}:
                </strong>{" "}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {displayDeadline}
                </span>
              </div>
            )}
            {task.completed_at && (
              <div>
                <strong className="text-sm text-gray-800 dark:text-gray-200">
                  {t("completedAtLabel", { defaultValue: "Completed at:" })}
                </strong>{" "}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(task.completed_at).toLocaleString()}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <strong className="text-sm text-gray-800 dark:text-gray-200">
                {task.deadline ? t("priorityLabel") : t("importanceLabel")}:
              </strong>{" "}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {task.deadline ? computedPriority.toFixed(2) : task.importance}
              </span>
            </div>
            <div>
              <strong className="text-sm text-gray-800 dark:text-gray-200">
                {t("deadlineLabel")}:
              </strong>{" "}
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {displayDeadline}
              </span>
            </div>
          </>
        )}
        <div className="flex gap-3 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
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
  const [showDetails, setShowDetails] = useState(false);

  return (
    <li
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      onClick={() => setShowDetails((prev) => !prev)}
    >
      <div className="flex justify-between items-center">
        <span className={`text-xl font-semibold ${task.completed ? "line-through" : ""} text-gray-900 dark:text-gray-100`}>
          {task.title}
        </span>
        <TaskHeader task={task} />
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
            <div onClick={(e) => e.stopPropagation()}>
              <TaskDetails 
                task={task}
                onEdit={onStartEditing}
                onComplete={onComplete}
                onDelete={onDelete}
                onReopen={onReopen}
              />
            </div>
          )}
        </>
      )}
    </li>
  );
};

interface TaskSectionProps {
  id?: string;
  title: string;
  tasks: (Task & { timeDiff?: number })[];
  showSection: boolean;
  toggleSection: () => void; 
  isCompletedSection?: boolean;
  taskEditorState: TaskEditorState;
  taskOperations: TaskOperations;
}

const TaskSection: React.FC<TaskSectionProps> = ({
  id,
  title,
  tasks,
  showSection,
  toggleSection,
  isCompletedSection = false,
  taskEditorState,
  taskOperations
}) => {
  const t = useTranslations("TaskDashboard");
  const {
    editingTaskId,
    editingTitle,
    editingImportance,
    editingDeadline,
    startEditing,
    cancelEditing,
    saveEditing,
    setEditingTitle,
    setEditingImportance,
    setEditingDeadline
  } = taskEditorState;
  
  const { completeTask, reopenTask, deleteTask } = taskOperations;
  
  return (
    <section id={id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
      <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-3 mb-4">
        <h2 className={sectionHeaderClasses}>{title}</h2>
        <ToggleButton
          expanded={showSection}
          onClick={toggleSection}
          label={showSection ? t("collapse") : t("expand")}
        />
      </div>
      {showSection && (
        <ul className="space-y-4">
          {tasks.length > 0 ? (
            tasks.map(task => (
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
              {isCompletedSection ? t("noCompletedTasks") : t("noTasks")}
            </p>
          )}
        </ul>
      )}
    </section>
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

  const taskEditorState = useTaskEditor(refreshTasks, username);
  const taskOperations = useTaskOperations(refreshTasks, username);
  const { tasksWithNoDeadlineActive, tasksWithDeadlineActive, completedTasks } = useTaskSorting(tasks, currentTime);

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

  return (
    <div className="space-y-12">
      <TaskSection 
        id="deadline-tasks"
        title={t("deadlineTasks")}
        tasks={tasksWithDeadlineActive}
        showSection={showDeadlineSection}
        toggleSection={() => setShowDeadlineSection(prev => !prev)}
        taskEditorState={taskEditorState}
        taskOperations={taskOperations}
      />
      
      <TaskSection 
        title={t("noDeadlineTasks")}
        tasks={tasksWithNoDeadlineActive}
        showSection={showNoDeadlineSection}
        toggleSection={() => setShowNoDeadlineSection(prev => !prev)}
        taskEditorState={taskEditorState}
        taskOperations={taskOperations}
      />
      
      <TaskSection 
        title={t("completedTasks")}
        tasks={completedTasks}
        showSection={showCompletedSection}
        toggleSection={() => setShowCompletedSection(prev => !prev)}
        isCompletedSection={true}
        taskEditorState={taskEditorState}
        taskOperations={taskOperations}
      />
    </div>
  );
};

export default InteractiveTaskDashboard;
