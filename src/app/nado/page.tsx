// src/app/page.tsx
"use client";
import useSWR from 'swr';
import InteractiveTaskDashboard from '../components/InteractiveTaskDashboard';
import TaskForm from '../components/TaskForm';

export type Task = {
  id: number;
  title: string;
  importance: number;
  deadline: string | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Page() {
  const { data: tasks, error, mutate } = useSWR<Task[]>('/api/nado-tasks', fetcher, { refreshInterval: 5000 });

  if (error) return <div>Error loading tasks.</div>;
  if (!tasks) return <div>Loading...</div>;

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          タスク一覧
        </h1>
        <TaskForm onTaskAdded={mutate} />
        <InteractiveTaskDashboard tasks={tasks} refreshTasks={mutate} />
      </div>
    </main>
  );
}
