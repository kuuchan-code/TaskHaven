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
  const [isHovered, setIsHovered] = useState(false);

  // タスクの期限切れ状態に基づいて背景色を動的に決定
  const getItemBackgroundClass = () => {
    if (task.completed) {
      return "bg-white dark:bg-gray-800";
    }
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const diffTime = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffTime < 0) {
        return "bg-red-100 dark:bg-red-900"; // より強調された期限切れ
      }
      if (diffTime < 24) {
        return "bg-yellow-100 dark:bg-yellow-900"; // より強調された24時間以内
      }
    }
    return "bg-white dark:bg-gray-800"; // デフォルト
  };
  
  // タスクの重要度に基づくボーダー色を取得
  const getImportanceBorderClass = () => {
    if (task.completed) return "border-gray-200 dark:border-gray-700";
    
    switch(task.importance) {
      case 3: return "border-red-500 dark:border-red-600 border-l-[6px]"; // 太いボーダー
      case 2: return "border-yellow-500 dark:border-yellow-600 border-l-[6px]"; // 太いボーダー
      default: return "border-blue-300 dark:border-blue-800";
    }
  };
  
  // タスクの状態アイコンを取得
  const getTaskStatusIcon = () => {
    if (task.completed) return "✅";
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      const diffTime = (deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (diffTime < 0) return "⚠️";
      if (diffTime < 24) return "⏰";
    }
    return "📝";
  };

  return (
    <li
      className={`${getItemBackgroundClass()} rounded-xl border-l-4 ${getImportanceBorderClass()} shadow-md p-6 
      hover:shadow-lg transition-all duration-300 transform ${isHovered ? 'translate-x-1' : ''} mb-4`}
      onClick={() => setShowDetails((prev) => !prev)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start">
        <span className={`flex items-center text-xl font-semibold ${task.completed ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
          <span className="mr-3 text-2xl">{getTaskStatusIcon()}</span>
          {task.title}
        </span>
        <div className="ml-4 min-w-[140px]">
          <TaskHeader task={task} />
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-6 animate-fadeIn">
          {isEditing ? (
            <div onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}
    </li>
  );
};

export default TaskItem; 