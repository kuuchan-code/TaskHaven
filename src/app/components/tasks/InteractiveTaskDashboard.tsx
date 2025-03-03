"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { InteractiveTaskDashboardProps } from "./types";
import { useTaskEditor, useTaskOperations, useTaskSorting } from "./taskUtils";
import TaskSection from "./TaskSection";

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({ tasks, refreshTasks, username }) => {
  const t = useTranslations("TaskDashboard");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  // デフォルトでは期限付きタスクのみ表示
  const [showNoDeadlineSection, setShowNoDeadlineSection] = useState(false);
  const [showDeadlineSection, setShowDeadlineSection] = useState(true);
  const [showCompletedSection, setShowCompletedSection] = useState(false);

  const taskEditorState = useTaskEditor(refreshTasks, username);
  const taskOperations = useTaskOperations(refreshTasks, username);
  const { tasksWithNoDeadlineActive, tasksWithDeadlineActive, completedTasks } = useTaskSorting(tasks, currentTime);

  // 毎分、現在時刻を更新して優先度計算を更新する
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // URLハッシュに基づいて特定のセクションにスクロール
  useEffect(() => {
    if (window.location.hash === "#deadline-tasks") {
      const element = document.getElementById("deadline-tasks");
      if (element) element.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // 期限切れタスクがあるかチェック
  const hasOverdueTasks = tasksWithDeadlineActive.some(task => {
    if (task.deadline) {
      const deadlineDate = new Date(task.deadline);
      return deadlineDate.getTime() < currentTime.getTime();
    }
    return false;
  });

  return (
    <div className="space-y-8">
      {/* 期限切れのタスクがある場合に警告を表示 */}
      {hasOverdueTasks && (
        <div className="bg-red-100 dark:bg-red-900 border-l-4 border-red-500 p-4 rounded-md animate-pulse">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 dark:text-red-300">
                {t("overdueTasksWarning")}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <TaskSection 
        id="deadline-tasks"
        title={t("deadlineTasks")}
        tasks={tasksWithDeadlineActive}
        showSection={showDeadlineSection}
        toggleSection={() => setShowDeadlineSection(prev => !prev)}
        taskEditorState={taskEditorState}
        taskOperations={taskOperations}
      />
      
      <TaskSection 
        title={t("noDeadlineTasks")}
        tasks={tasksWithNoDeadlineActive}
        showSection={showNoDeadlineSection}
        toggleSection={() => setShowNoDeadlineSection(prev => !prev)}
        taskEditorState={taskEditorState}
        taskOperations={taskOperations}
      />
      
      <TaskSection 
        title={t("completedTasks")}
        tasks={completedTasks}
        showSection={showCompletedSection}
        toggleSection={() => setShowCompletedSection(prev => !prev)}
        isCompletedSection={true}
        taskEditorState={taskEditorState}
        taskOperations={taskOperations}
      />
    </div>
  );
};

export default InteractiveTaskDashboard; 