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
            className={`${buttonClasses} flex-1`}
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
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm"
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
              className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md shadow hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors text-sm"
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
            className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-800 text-white rounded-md shadow hover:bg-red-700 dark:hover:bg-red-900 transition-colors text-sm"
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