"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { TaskHeaderProps } from "./types";
import { PriorityLabel } from "./UIComponents";
import { formatRemainingTime } from "./taskUtils";

const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => {
  const t = useTranslations("TaskDashboard");
  const locale = useLocale();
  
  if (task.completed) {
    return (
      <div className="flex flex-col items-end gap-2">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
          {t("importanceText", { value: task.importance })}
        </span>
        {task.deadline && (
          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
            <span className="font-medium">{t("deadlineLabel")}</span>: {new Date(task.deadline).toLocaleString()}
          </span>
        )}
        {task.completed_at && (
          <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap bg-green-100 dark:bg-green-900 px-2 py-1 rounded-full mt-1">
            <span className="font-medium">{t("completedAtLabel", { defaultValue: "Completed at:" })}</span>{" "}
            {new Date(task.completed_at).toLocaleString()}
          </span>
        )}
      </div>
    );
  } 
  
  if (task.deadline) {
    const deadlineDate = new Date(task.deadline!);
    const diffTime = (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    const isOverdue = diffTime < 0;
    
    return (
      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {t("priorityText", { value: task.priority?.toFixed(2) })}
          </span>
          <PriorityLabel priority={task.priority!} />
        </div>
        <span className={`text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'} whitespace-nowrap rounded-full px-2 py-0.5 ${isOverdue ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
          {isOverdue
            ? `${t("overdue")} ${formatRemainingTime(-diffTime, locale, t)}`
            : `${t("remaining")} ${formatRemainingTime(diffTime, locale, t)}`}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-end gap-1">
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
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

export default TaskHeader; 