// src/app/page.tsx
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import InteractiveTaskDashboard from './components/InteractiveTaskDashboard';

export type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD" or "YYYY-MM-DD HH:mm" (null if no deadline)
};

export default async function Page() {
  // CSV 読み込み
  const filePath = path.join(process.cwd(), "", "tasks.csv");
  const csvData = await fs.readFile(filePath, "utf8");

  // CSV Recordの型
  type CSVRecord = {
    title: string;
    importance: string;
    deadline: string;
  };

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
  }) as CSVRecord[];

  // タスク情報を整形
  const tasks: Task[] = records.map((record) => ({
    title: record.title,
    importance: Number(record.importance),
    deadline: record.deadline === "" ? null : record.deadline,
  }));

  // ここでは「計算」はしない。タスクの生データをそのままクライアントに渡す
  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          タスク一覧
        </h1>
        <InteractiveTaskDashboard tasks={tasks} />
      </div>
    </main>
  );
}
