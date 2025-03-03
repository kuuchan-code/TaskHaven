"use client";

import { Task } from "@/app/types/taskTypes";
import { formatForDatetimeLocal, convertLocalToIsoWithOffset } from "@/app/utils/dateUtils";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { TaskEditorState, TaskOperations } from "./types";

// 優先度計算のためのユーティリティ関数
export const calculatePriority = (importance: number, deadline: string | null): number => {
  if (!deadline) return importance;
  const deadlineDate = new Date(deadline);
  const diffTime = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
  return diffTime >= 0 ? importance / Math.pow(diffTime + 1, 0.5) : importance;
};

// 残り時間のフォーマット
export const formatRemainingTime = (hours: number, locale?: string, t?: any): string => {
  // ロケールが直接渡されない場合はブラウザのロケールを使用
  if (!locale && typeof window !== 'undefined') {
    locale = window.navigator.language;
  }
  const isJapanese = locale?.startsWith('ja');

  // 翻訳関数が渡された場合はそれを使用
  if (t) {
    if (hours < 24) {
      return `${hours.toFixed(1)} ${t(hours < 2 ? "hour" : "hours")}`;
    }
    
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    
    return `${days} ${t(days === 1 ? "day" : "days")} ${remHours.toFixed(0)} ${t(remHours === 1 ? "hour" : "hours")}`;
  } 
  // 従来の方法（翻訳関数が渡されない場合）
  else {
    if (hours < 24) {
      return isJapanese
        ? `${hours.toFixed(1)}時間`
        : `${hours.toFixed(1)} ${hours < 2 ? "hour" : "hours"}`;
    }
    
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    
    return isJapanese
      ? `${days}日 ${remHours.toFixed(0)}時間`
      : `${days} ${days === 1 ? "day" : "days"} ${remHours.toFixed(0)} ${remHours === 1 ? "hour" : "hours"}`;
  }
};

// タスク編集状態管理カスタムフック
export const useTaskEditor = (refreshTasks: () => void, username: string): TaskEditorState => {
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

// タスク操作カスタムフック
export const useTaskOperations = (refreshTasks: () => void, username: string): TaskOperations => {
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

// タスクソート用カスタムフック
export const useTaskSorting = (tasks: Task[], currentTime: Date) => {
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

  // 完了済みタスクを完了日時の降順でソート（最新の完了タスクが先頭に来るように）
  const completedTasks = tasks
    .filter(task => task.completed)
    .sort((a, b) => {
      // 完了日時がある場合はそれでソート
      if (a.completed_at && b.completed_at) {
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      }
      // 片方にだけ完了日時がある場合
      if (a.completed_at) return -1;
      if (b.completed_at) return 1;
      // 両方とも完了日時がない場合はIDでソート
      return b.id - a.id;
    });

  return { tasksWithNoDeadlineActive, tasksWithDeadlineActive, completedTasks };
}; 