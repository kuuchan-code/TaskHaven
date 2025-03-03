"use client";

import useSWR from "swr";
import TasksView from "./tasks/TasksView";
import TaskForm from "./TaskForm";
import WebhookForm from "./WebhookForm";
import TaskStreak from "./TaskStreak";
import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Task } from "../types/taskTypes";

type User = {
  username: string;
  webhook_url?: string;
  notification_interval?: number;
};

type TaskPageProps = {
  username: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TaskPage({ username }: TaskPageProps) {
  const t = useTranslations("TaskPage");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'tasks' | 'stats' | 'settings'>(
    (tabParam === 'tasks' || tabParam === 'stats' || tabParam === 'settings') 
      ? tabParam 
      : 'tasks'
  );
  
  // URLのtabパラメータが変更されたときにactiveTabを更新
  useEffect(() => {
    if (tabParam === 'tasks' || tabParam === 'stats' || tabParam === 'settings') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  const { data: tasks, error: tasksError, mutate: mutateTasks } = useSWR<Task[]>(
    `/api/tasks?username=${username}`,
    fetcher
  );
  const { data: user, error: userError } = useSWR<User>(
    `/api/user?username=${username}`,
    fetcher
  );

  // タスクデータをログに出力
  useEffect(() => {
    if (tasks) {
      console.log('Tasks data loaded:', tasks);
    }
  }, [tasks]);

  // 簡易的なトースト通知
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (tasksError || userError) return <div>{t("errorLoadingData")}</div>;
  if (!tasks || !user) return <div>{t("loading")}</div>;

  // タブボタンのスタイル
  const tabButtonClass = (isActive: boolean) => `
    px-4 py-2 border-b-2 transition-colors duration-200 font-medium 
    ${isActive 
      ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' 
      : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'}
  `;

  return (
    <main className="flex-grow bg-gray-100 dark:bg-gray-900 p-8 relative">
      {/* トースト通知 */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-md z-50 animate-bounce">
          {toastMessage}
        </div>
      )}
      
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-medium text-center text-gray-900 dark:text-gray-100 mb-4">
          {t("pageTitle", { username })}
        </h1>
        
        {/* タブナビゲーション */}
        <nav className="flex border-b border-gray-300 dark:border-gray-700 mb-8">
          <button
            className={tabButtonClass(activeTab === 'tasks')}
            onClick={() => setActiveTab('tasks')}
          >
            {t("tasksTab")}
          </button>
          <button
            className={tabButtonClass(activeTab === 'stats')}
            onClick={() => setActiveTab('stats')}
          >
            {t("statsTab")}
          </button>
          <button
            className={tabButtonClass(activeTab === 'settings')}
            onClick={() => setActiveTab('settings')}
          >
            {t("settingsTab")}
          </button>
        </nav>
        
        {/* タブコンテンツ */}
        <div>
          {activeTab === 'tasks' && (
            <div className="space-y-8">
              <TaskForm 
                onTaskAdded={() => { 
                  mutateTasks(); 
                  showToast(t("taskAddedSuccess", { defaultValue: "タスクが追加されました！" })); 
                }} 
                username={username} 
              />
              <TasksView 
                tasks={tasks} 
                refreshTasks={mutateTasks} 
                username={username} 
              />
            </div>
          )}
          
          {activeTab === 'stats' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t("statsTabTitle")}</h2>
              {/* タスクデータをログに出力して確認 */}
              <div style={{display: 'none'}}>{
                // @ts-ignore
                console.log('TaskStreak に渡されるタスク:', tasks)
              }</div>
              <TaskStreak tasks={tasks} />
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">{t("settingsTabTitle")}</h2>
              <WebhookForm
                username={username}
                currentWebhook={user.webhook_url || ""}
                currentNotificationInterval={user.notification_interval}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
