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
      <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
        高優先度
      </span>
    );
  }
  if (priority > MEDIUM_PRIORITY_THRESHOLD && priority < HIGH_PRIORITY_THRESHOLD) {
    return (
      <span className="bg-yellow-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
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
    className="flex items-center justify-center text-sm font-semibold text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-md px-4 py-2 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        ショートカット締切：
      </span>
      <div className="flex flex-wrap gap-2 mt-1">
        {shortcuts.map(({ label, hours }) => (
          <button
            key={hours}
            type="button"
            onClick={() => setDeadline(getRelativeDeadline(hours))}
            className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {label}
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
}) => (
  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md shadow-inner">
    <div>
      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
        タイトル:
      </label>
      <input
        type="text"
        value={editingTitle}
        onChange={(e) => setEditingTitle(e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm p-2"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">
        重要度: {editingImportance}
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
        締切:
      </label>
      <input
        type="datetime-local"
        value={editingDeadline || ""}
        onChange={(e) => setEditingDeadline(e.target.value)}
        className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm p-2"
      />
      <DeadlineShortcuts setDeadline={setEditingDeadline} />
    </div>
    <div className="flex justify-end space-x-3">
      <button onClick={onSave} className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors">
        保存
      </button>
      <button onClick={onCancel} className="px-4 py-2 bg-gray-500 text-white rounded-md shadow hover:bg-gray-600 transition-colors">
        キャンセル
      </button>
    </div>
  </div>
);

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
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex justify-between items-center">
        <span className={`text-xl font-semibold ${task.completed ? "line-through" : ""} text-gray-900 dark:text-gray-100`}>
          {task.title}
        </span>
        {typeof task.timeDiff === "number" && typeof task.priority === "number" ? (
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              優先度: {task.priority.toFixed(2)}
            </span>
            <PriorityLabel priority={task.priority} />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {task.timeDiff >= 0
                ? `残り: ${formatRemainingTime(task.timeDiff)}`
                : `超過: ${formatRemainingTime(-task.timeDiff)}`}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              重要度: {task.importance}
            </span>
            {task.importance >= 9 ? (
              <span className="bg-red-600 text-white text-xs font-bold rounded-full px-2 py-0.5">
                高重要度
              </span>
            ) : task.importance >= 7 ? (
              <span className="bg-yellow-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                中重要度
              </span>
            ) : null}
          </div>
        )}
      </div>
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
        <div className="mt-4 border-t pt-3" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <div>
              <strong className="text-sm text-gray-800 dark:text-gray-200">重要度:</strong>{" "}
              <span className="text-sm text-gray-700 dark:text-gray-300">{task.importance}</span>
            </div>
            <div>
              <strong className="text-sm text-gray-800 dark:text-gray-200">締切:</strong>{" "}
              <span className="text-sm text-gray-700 dark:text-gray-300">{displayDeadline}</span>
            </div>
            <div className="flex gap-3 mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartEditing();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md shadow hover:bg-green-700 transition-colors text-sm"
              >
                編集
              </button>
              {task.completed ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReopen();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors text-sm"
                >
                  再開
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700 transition-colors text-sm"
                >
                  完了
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md shadow hover:bg-red-700 transition-colors text-sm"
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
  const [showNoDeadlineSection, setShowNoDeadlineSection] = useState(false);
  const [showDeadlineSection, setShowDeadlineSection] = useState(true);
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [showCalendarAndTasks, setShowCalendarAndTasks] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 編集状態 (各セクション共通)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingImportance, setEditingImportance] = useState(1);
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
            onClick={() => {}}
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
    <div className="space-y-12 p-6">
      {/* 期限なしタスク */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
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
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
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
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            カレンダー
          </h2>
          <ToggleButton
            expanded={showCalendarAndTasks}
            onClick={() => setShowCalendarAndTasks((prev) => !prev)}
            label={showCalendarAndTasks ? "折りたたむ" : "展開する"}
          />
        </div>
        {showCalendarAndTasks && (
          <>
            <div className="p-4">
              <CalendarWrapper
                tasks={tasks.filter((task) => task.deadline !== null)}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />
            </div>
            <section className="mt-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 border-b pb-2 mb-4">
                {selectedDate
                  ? `選択された日のタスク (${formatDate(selectedDate)})`
                  : "選択された日のタスク"}
              </h3>
              {selectedDate ? (
                renderTaskList(tasksForSelectedDate)
              ) : (
                <p className="text-gray-600 dark:text-gray-300">
                  カレンダーをクリックして日付を選択してください。
                </p>
              )}
            </section>
          </>
        )}
      </section>

      {/* 完了済みタスク */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
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
