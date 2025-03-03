import { Task } from "@/app/types/taskTypes";

// ユーティリティ関連の型
export interface TaskEditorState {
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

export interface TaskOperations {
  completeTask: (taskId: number) => Promise<void>;
  reopenTask: (taskId: number) => Promise<void>;
  deleteTask: (taskId: number) => Promise<void>;
}

// コンポーネント関連の型
export interface PriorityLabelProps {
  priority: number;
}

export interface ToggleButtonProps {
  expanded: boolean;
  onClick: () => void;
  label: string;
}

export interface DeadlineShortcutsProps {
  setDeadline: (deadline: string) => void;
}

export interface TaskEditorProps {
  editingTitle: string;
  editingImportance: number;
  editingDeadline: string | null;
  setEditingTitle: (title: string) => void;
  setEditingImportance: (importance: number) => void;
  setEditingDeadline: (deadline: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export interface TaskHeaderProps {
  task: Task & { timeDiff?: number };
}

export interface TaskDetailsProps {
  task: Task;
  onEdit: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onReopen: () => void;
}

export interface TaskItemProps {
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

export interface TaskSectionProps {
  id?: string;
  title: string;
  tasks: (Task & { timeDiff?: number })[];
  showSection: boolean;
  toggleSection: () => void; 
  isCompletedSection?: boolean;
  taskEditorState: TaskEditorState;
  taskOperations: TaskOperations;
}

export interface InteractiveTaskDashboardProps {
  tasks: Task[];
  refreshTasks: () => void;
  username: string;
} 