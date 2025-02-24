// src/app/page.tsx
import { promises as fs } from 'fs';
import path from 'path';
import CalendarWrapper from './components/CalendarWrapper';
import InteractiveTaskDashboard from './components/InteractiveTaskDashboard';

export type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD" or null（※期限付きタスクの場合は "YYYY-MM-DD HH:mm" 形式）
};
export default async function Page() {
  // public/tasks.json を読み込む
  const filePath = path.join(process.cwd(), "public", "tasks.json");
  const jsonData = await fs.readFile(filePath, "utf8");
  const tasks: Task[] = JSON.parse(jsonData);

  // 期限なしタスク（importance 降順）
  const tasksWithNoDeadline = tasks
    .filter((task) => task.deadline === null)
    .sort((a, b) => b.importance - a.importance);

  // 期限付きタスク（優先度計算後、優先度順）
  const ADJUSTMENT_FACTOR = 0.22;
  const now = new Date();
  const tasksWithDeadline = tasks
    .filter((task) => task.deadline !== null)
    .map((task) => {
      const deadlineDate = new Date(task.deadline as string);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const remainingHours = Math.max(diffTime / (1000 * 60 * 60), 1);
      const priority = task.importance / Math.pow(remainingHours + 1, ADJUSTMENT_FACTOR)
      return { ...task, remainingHours, priority };
    })
    .sort((a, b) => b.priority - a.priority);

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          タスク一覧
        </h1>
        <InteractiveTaskDashboard
          tasks={tasks}
          tasksWithDeadline={tasksWithDeadline}
          tasksWithoutDeadline={tasksWithNoDeadline}
        />
      </div>
    </main>
  );
}