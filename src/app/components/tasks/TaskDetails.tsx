"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TaskDetailsProps } from "./types";
import { calculatePriority } from "./taskUtils";
import { buttonClasses } from "@/app/utils/designUtils";

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
    <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="space-y-3">
        {task.completed ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <strong className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                {t("importanceLabel")}:
              </strong>
              <span className="text-base text-gray-700 dark:text-gray-300">
                {task.importance}
              </span>
            </div>
            {task.deadline && (
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                <strong className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                  {t("deadlineLabel")}:
                </strong>
                <span className="text-base text-gray-700 dark:text-gray-300">
                  {displayDeadline}
                </span>
              </div>
            )}
            {task.completed_at && (
              <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg shadow-sm">
                <strong className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                  {t("completedAtLabel", { defaultValue: "Completed at:" })}
                </strong>
                <span className="text-base text-gray-700 dark:text-gray-300">
                  {new Date(task.completed_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <strong className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                {task.deadline ? t("priorityLabel") : t("importanceLabel")}:
              </strong>
              <span className="text-base text-gray-700 dark:text-gray-300 font-medium">
                {task.deadline ? computedPriority.toFixed(2) : task.importance}
              </span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg shadow-sm">
              <strong className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                {t("deadlineLabel")}:
              </strong>
              <span className="text-base text-gray-700 dark:text-gray-300">
                {displayDeadline}
              </span>
            </div>
          </div>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className={`${buttonClasses} flex-1 py-2.5 text-base`}
            aria-label={t("edit")}
          >
            {t("edit")}
          </button>
          {task.completed ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReopen();
              }}
              className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-base"
              aria-label={t("reopen")}
            >
              {t("reopen")}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-base"
              aria-label={t("complete")}
            >
              {t("complete")}
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex-1 px-4 py-2.5 bg-red-600 dark:bg-red-800 text-white rounded-md shadow hover:bg-red-700 dark:hover:bg-red-900 transition-colors text-base"
            aria-label={t("delete")}
          >
            {t("delete")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails; 