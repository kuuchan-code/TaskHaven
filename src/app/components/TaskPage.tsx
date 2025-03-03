"use client";

import useSWR from "swr";
import InteractiveTaskDashboard from "./tasks/InteractiveTaskDashboard";
import TaskForm from "./TaskForm";
import WebhookForm from "./WebhookForm";
import TaskStreak from "./TaskStreak";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
  const { data: tasks, error: tasksError, mutate: mutateTasks } = useSWR<Task[]>(
    `/api/tasks?username=${username}`,
    fetcher
  );
  const { data: user, error: userError } = useSWR<User>(
    `/api/user?username=${username}`,
    fetcher
  );

  // 簡易的なトースト通知（例としてメッセージを一定時間表示）
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (tasksError || userError) return <div>{t("errorLoadingData")}</div>;
  if (!tasks || !user) return <div>{t("loading")}</div>;

  return (
    <main className="flex-grow bg-gray-100 dark:bg-gray-900 p-8 relative">
      {toastMessage && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded shadow-md">
          {toastMessage}
        </div>
      )}
      <div className="max-w-5xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-gray-100">
          {t("pageTitle", { username })}
        </h1>
        {/* タスク達成ストリークを表示 */}
        <TaskStreak tasks={tasks} />
        <WebhookForm
          username={username}
          currentWebhook={user.webhook_url || ""}
          currentNotificationInterval={user.notification_interval}
        />
        <TaskForm onTaskAdded={() => { mutateTasks(); showToast(t("taskAddedSuccess", { defaultValue: "タスクが追加されました！" })); }} username={username} />
        <InteractiveTaskDashboard tasks={tasks} refreshTasks={mutateTasks} username={username} />
      </div>
    </main>
  );
}
