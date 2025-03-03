"use client";

import React, { useState } from "react";
import { TaskItemProps } from "./types";
import TaskHeader from "./TaskHeader";
import TaskDetails from "./TaskDetails";
import TaskEditor from "./TaskEditor";

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

  // タスクの期限切れ状態に基づいて背景色を動的に決定
  const getItemBackgroundClass = () => {
    if (task.completed) {
      return "bg-white dark:bg-gray-800";
    }
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const diffTime = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffTime < 0) {
        return "bg-red-50 dark:bg-red-950"; // 期限切れ
      }
      if (diffTime < 24) {
        return "bg-yellow-50 dark:bg-yellow-950"; // 24時間以内
      }
    }
    return "bg-white dark:bg-gray-800"; // デフォルト
  };

  return (
    <li
      className={`cursor-pointer ${getItemBackgroundClass()} rounded-xl shadow-md p-6 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors`}
      onClick={() => setShowDetails((prev) => !prev)}
    >
      <div className="flex justify-between items-center">
        <span className={`text-xl font-semibold ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
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

export default TaskItem; 