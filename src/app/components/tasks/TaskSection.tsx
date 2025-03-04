"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TaskSectionProps } from "./types";
import { ToggleButton } from "./UIComponents";
import TaskItem from "./TaskItem";
import { sectionHeaderClasses } from "@/app/utils/designUtils";

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

  // バッジをタイトルに追加
  const getTaskCountBadge = () => {
    return (
      <span className="ml-2 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
        {tasks.length}
      </span>
    );
  };
  
  return (
    <section id={id} className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 transition-all duration-300 ease-in-out hover:shadow-lg">
      <div className="flex justify-between items-center border-b border-gray-300 dark:border-gray-700 pb-3 mb-4">
        <h2 className={sectionHeaderClasses}>
          {title} {getTaskCountBadge()}
        </h2>
        <ToggleButton
          expanded={showSection}
          onClick={toggleSection}
          label={showSection ? t("collapse") : t("expand")}
        />
      </div>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${showSection ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
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
      </div>
    </section>
  );
};

export default TaskSection; 