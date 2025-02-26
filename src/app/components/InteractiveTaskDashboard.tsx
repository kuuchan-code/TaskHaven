import React, { useEffect, useState } from "react";
import CalendarWrapper from "./CalendarWrapper";

export type Task = {
  completed: boolean;
  id: number;
  title: string;
  importance: number;
  deadline: string | null;
};

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

// Helper functions for date formatting and relative deadlines
const formatForDatetimeLocal = (isoString: string): string => {
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

const getRelativeDeadline = (hours: number): string => {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

// Component for shortcut deadline buttons
interface DeadlineShortcutsProps {
  setDeadline: (deadline: string) => void;
}
const DeadlineShortcuts: React.FC<DeadlineShortcutsProps> = ({ setDeadline }) => {
  const shortcuts = [
    { label: "1時間後", hours: 1 },
    { label: "3時間後", hours: 3 },
    { label: "1日後", hours: 24 },
    { label: "3日後", hours: 72 },
    { label: "1週間後", hours: 168 },
  ];
  return (
    <div className="mt-2">
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">ショートカット締切：</span>
      <div className="flex space-x-2 mt-1">
        {shortcuts.map(({ label, hours }) => (
          <button
            key={hours}
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(hours))}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-sm rounded"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Reusable editing form for a task
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
}) => (
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
        value={editingDeadline || ""}
        onChange={(e) => setEditingDeadline(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      />
      <DeadlineShortcuts setDeadline={setEditingDeadline} />
    </div>
    <div className="flex space-x-2">
      <button onClick={onSave} className="px-3 py-1 bg-green-500 text-white rounded">
        保存
      </button>
      <button onClick={onCancel} className="px-3 py-1 bg-gray-500 text-white rounded">
        キャンセル
      </button>
    </div>
  </div>
);

// Reusable task card component
interface TaskItemProps {
  task: Task & {
    timeDiff?: number;
    priority?: number;
    deadlineDate?: Date;
  };
  isEditing: boolean;
  onClick: () => void;
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
  onClick,
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
  const displayDeadline = task.deadline
    ? new Date(task.deadline).toLocaleString()
    : "期限なし";

  return (
    <li
      onClick={onClick}
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
    >
      <div className="flex justify-between items-center">
        <span
          className={`text-xl font-medium ${
            task.completed ? "line-through" : ""
          } text-gray-900 dark:text-gray-100`}
        >
          {task.title}
        </span>
        {typeof task.timeDiff === "number" && typeof task.priority === "number" ? (
          <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
            <span>優先度: {task.priority.toFixed(2)}</span>
            <PriorityLabel priority={task.priority} />
            <span className="text-base text-gray-600 dark:text-gray-300">
              {task.timeDiff >= 0
                ? `残り: ${formatRemainingTime(task.timeDiff)}`
                : `超過: ${formatRemainingTime(-task.timeDiff)}`}
            </span>
          </div>
        ) : (
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
        )}
      </div>
      {isEditing ? (
        <div
          className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2"
          onClick={(e) => e.stopPropagation()}
        >
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
        <div
          className="mt-2 text-sm text-gray-500 dark:text-gray-400 border-t pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <div>
              <strong>重要度:</strong> {task.importance}
            </div>
            <div>
              <strong>締切:</strong> {displayDeadline}
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing();
                }}
                className="px-3 py-1 bg-green-500 text-white rounded"
              >
                編集
              </button>
              {task.completed ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReopen();
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  再開
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  className="px-3 py-1 bg-blue-500 text-white rounded"
                >
                  完了
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

interface InteractiveTaskDashboardProps {
  tasks: Task[];
  refreshTasks: () => void;
  source: string;
}

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({
  tasks,
  refreshTasks,
  source,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [showNoDeadlineSection, setShowNoDeadlineSection] = useState(false);
  const [showDeadlineSection, setShowDeadlineSection] = useState(true);
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [showCalendarAndTasks, setShowCalendarAndTasks] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Editing state (shared across sections)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingImportance, setEditingImportance] = useState(1);
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Pre-filter tasks for different sections
  const tasksWithNoDeadlineActive = tasks
    .filter((task) => task.deadline === null && !task.completed)
    .sort((a, b) => b.importance - a.importance);

  const tasksWithDeadlineActive = tasks
    .filter((task) => task.deadline !== null && !task.completed)
    .map((task) => {
      const deadlineDate = new Date(task.deadline as string);
      const diffTime = (deadlineDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      const priority =
        diffTime >= 0
          ? task.importance / Math.pow(diffTime + 1, ADJUSTMENT_FACTOR)
          : task.importance * (1 + Math.abs(diffTime) / 10);
      return { ...task, timeDiff: diffTime, priority, deadlineDate };
    })
    .sort((a, b) => (b.priority as number) - (a.priority as number));

  const completedTasks = tasks.filter((task) => task.completed);

  const tasksForSelectedDate = selectedDate
    ? tasksWithDeadlineActive.filter(
        (task) => formatDate(task.deadlineDate as Date) === formatDate(selectedDate)
      )
    : [];

  // Handlers for task item interactions
  const handleTaskClick = (deadline: string | null, taskId: number) => {
    if (deadline) {
      setSelectedDate(new Date(deadline));
    }
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

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

  const convertLocalToIsoWithOffset = (localDateString: string): string => {
    const localDate = new Date(localDateString);
    const pad = (num: number) => String(num).padStart(2, "0");
    const year = localDate.getFullYear();
    const month = pad(localDate.getMonth() + 1);
    const day = pad(localDate.getDate());
    const hours = pad(localDate.getHours());
    const minutes = pad(localDate.getMinutes());
    const seconds = pad(localDate.getSeconds());
    const timezoneOffset = localDate.getTimezoneOffset();
    const offsetSign = timezoneOffset > 0 ? "-" : "+";
    const offsetHours = pad(Math.floor(Math.abs(timezoneOffset) / 60));
    const offsetMinutes = pad(Math.abs(timezoneOffset) % 60);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
  };

  const saveEditing = async (taskId: number) => {
    let deadlineToSave: string | null = editingDeadline;
    if (deadlineToSave && deadlineToSave !== "") {
      deadlineToSave = convertLocalToIsoWithOffset(deadlineToSave);
    } else {
      deadlineToSave = null;
    }
    const res = await fetch("/api/tasks", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: taskId,
        title: editingTitle,
        importance: editingImportance,
        deadline: deadlineToSave,
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

  const completeTask = async (taskId: number) => {
    if (confirm("このタスクを完了にしますか？")) {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, completed: true, source }),
      });
      if (res.ok) {
        refreshTasks();
      }
    }
  };

  const reopenTask = async (taskId: number) => {
    if (confirm("このタスクを再開しますか？")) {
      const res = await fetch("/api/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: taskId, completed: false, source }),
      });
      if (res.ok) {
        refreshTasks();
      }
    }
  };

  // Helper to render a list of tasks using TaskItem
  const renderTaskList = (
    taskList: (Task & { timeDiff?: number; priority?: number; deadlineDate?: Date })[],
    completedSection: boolean = false
  ) => (
    <ul className="space-y-4">
      {taskList.length > 0 ? (
        taskList.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isEditing={editingTaskId === task.id}
            onClick={() => handleTaskClick(task.deadline, task.id)}
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
        <p className="text-gray-600 dark:text-gray-300">
          {completedSection ? "完了済みタスクはありません。" : "タスクはありません。"}
        </p>
      )}
    </ul>
  );

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
        {showNoDeadlineSection && renderTaskList(tasksWithNoDeadlineActive)}
      </section>

      {/* 期限付きタスク */}
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
        {showDeadlineSection && renderTaskList(tasksWithDeadlineActive)}
      </section>

      {/* カレンダーと選択日のタスク */}
      <section>
        <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-2 mb-4">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200">
            カレンダー＆選択日のタスク
          </h2>
          <ToggleButton
            expanded={showCalendarAndTasks}
            onClick={() => setShowCalendarAndTasks((prev) => !prev)}
            label={showCalendarAndTasks ? "折りたたむ" : "展開する"}
          />
        </div>
        {showCalendarAndTasks && (
          <>
            <div className="p-6">
              <CalendarWrapper
                tasks={tasks.filter((task) => task.deadline !== null)}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </div>
            <section>
              <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                {selectedDate
                  ? `選択された日のタスク (${formatDate(selectedDate)})`
                  : "選択された日のタスク"}
              </h2>
              {selectedDate ? renderTaskList(tasksForSelectedDate) : (
                <p className="text-gray-600 dark:text-gray-300">
                  カレンダーまたはタスクをクリックして日付を選択してください。
                </p>
              )}
            </section>
          </>
        )}
      </section>

      {/* 完了済みタスク */}
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
        {showCompletedSection && renderTaskList(completedTasks, true)}
      </section>
    </div>
  );
};

export default InteractiveTaskDashboard;
