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
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("importanceText", { value: task.importance })}
        </span>
        {task.deadline && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("deadlineLabel")} {new Date(task.deadline).toLocaleString()}
          </span>
        )}
        {task.completed_at && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t("completedAtLabel", { defaultValue: "Completed at:" })}{" "}
            {new Date(task.completed_at).toLocaleString()}
          </span>
        )}
      </div>
    );
  } 
  
  if (task.deadline) {
    return (
      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {t("priorityText", { value: task.priority?.toFixed(2) })}
        </span>
        <PriorityLabel priority={task.priority!} />
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {(() => {
            const deadlineDate = new Date(task.deadline!);
            const diffTime = (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
            return diffTime >= 0
              ? `${t("remaining")} ${formatRemainingTime(diffTime, locale, t)}`
              : `${t("overdue")} ${formatRemainingTime(-diffTime, locale, t)}`;
          })()}
        </span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 dark:text-gray-300">
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