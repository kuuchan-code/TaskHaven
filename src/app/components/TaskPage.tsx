// src/app/components/TaskPage.tsx
"use client";

import useSWR from 'swr';
import InteractiveTaskDashboard from './InteractiveTaskDashboard';
import TaskForm from './TaskForm';

export type Task = {
  completed: boolean;
  id: number;
  title: string;
  importance: number;
  deadline: string | null;
};

type TaskPageProps = {
  username: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TaskPage({ username }: TaskPageProps) {
  const { data: tasks, error, mutate } = useSWR<Task[]>(`/api/tasks?username=${username}`, fetcher);

  if (error) return <div>Error loading tasks.</div>;
  if (!tasks) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          {username}のタスク
        </h1>
        <TaskForm onTaskAdded={mutate} username={username} />
        <InteractiveTaskDashboard tasks={tasks} refreshTasks={mutate} username={username} />
      </div>
    </main>
  );
}
