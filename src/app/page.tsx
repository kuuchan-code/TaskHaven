// src/app/page.tsx
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import InteractiveTaskDashboard from './components/InteractiveTaskDashboard';

const ADJUSTMENT_FACTOR = 0.5;

export type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD" or null（※期限付きタスクの場合は "YYYY-MM-DD HH:mm" 形式）
};

export default async function Page() {
  // tasks/tasks.csv を読み込む
  const filePath = path.join(process.cwd(), "", "tasks.csv");
  const csvData = await fs.readFile(filePath, "utf8");
  // CSV をパース（ヘッダー行がある前提）
  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  });
  // レコードを Task 型の配列に変換
  const tasks: Task[] = records.map((record: any) => ({
    title: record.title,
    importance: Number(record.importance),
    deadline: record.deadline === "" ? null : record.deadline,
  }));

  // 期限なしタスク（importance 降順）
  const tasksWithNoDeadline = tasks
    .filter((task) => task.deadline === null)
    .sort((a, b) => b.importance - a.importance);

  // 期限付きタスク（優先度計算後、優先度順）
  const now = new Date();
  const tasksWithDeadline = tasks
    .filter((task) => task.deadline !== null)
    .map((task) => {
      const deadlineDate = new Date(task.deadline as string);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const remainingHours = Math.max(diffTime / (1000 * 60 * 60), 1);
      const priority = task.importance / Math.pow(remainingHours + 1, ADJUSTMENT_FACTOR);
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
