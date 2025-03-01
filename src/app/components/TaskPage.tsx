"use client";

import useSWR from 'swr';
import InteractiveTaskDashboard from './InteractiveTaskDashboard';
import TaskForm from './TaskForm';
import WebhookForm from './WebhookForm';

export type Task = {
  completed: boolean;
  id: number;
  title: string;
  importance: number;
  deadline: string | null;
};

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
  // タスクを取得
  const { data: tasks, error: tasksError, mutate: mutateTasks } = useSWR<Task[]>(`/api/tasks?username=${username}`, fetcher);
  // ユーザー情報（設定値）を取得
  const { data: user, error: userError } = useSWR<User>(`/api/user?username=${username}`, fetcher);

  if (tasksError || userError) return <div>Error loading data.</div>;
  if (!tasks || !user) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          {username}のタスク
        </h1>
        {/* 取得したユーザー情報から currentWebhook と currentNotificationInterval をフォームに渡す */}
        <WebhookForm
          username={username}
          currentWebhook={user.webhook_url || ""}
          currentNotificationInterval={user.notification_interval}
        />
        <TaskForm onTaskAdded={mutateTasks} username={username} />
        <InteractiveTaskDashboard tasks={tasks} refreshTasks={mutateTasks} username={username} />
      </div>
    </main>
  );
}
