// src/app/page.tsx
import { promises as fs } from 'fs';
import path from 'path';
import CalendarWrapper from './components/CalendarWrapper';

export type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD" or null（※期限付きタスクの場合は "YYYY-MM-DD HH:mm" 形式）
};

export default async function Page() {
  // publicディレクトリ内の tasks.json を読み込む
  const filePath = path.join(process.cwd(), 'public', 'tasks.json');
  const jsonData = await fs.readFile(filePath, 'utf8');
  const tasks: Task[] = JSON.parse(jsonData);

  // (1) 期限なしタスク：importance 降順にソート
  const tasksWithNoDeadline = tasks
    .filter(task => task.deadline === null)
    .sort((a, b) => b.importance - a.importance);

  // (2) 期限付きタスク：残り時間の逆数×importance×調整係数でスコア計算
  const ADJUSTMENT_FACTOR = 24;
  const now = new Date();
  const tasksWithDeadline = tasks
    .filter(task => task.deadline !== null)
    .map(task => {
      // 期限付きタスクは "YYYY-MM-DD HH:mm" 形式で格納
      const deadlineDate = new Date(task.deadline as string);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const remainingHours = Math.max(diffTime / (1000 * 60 * 60), 1);
      const score = task.importance * (1 / remainingHours) * ADJUSTMENT_FACTOR;
      return { ...task, remainingHours, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-10">タスク一覧</h1>

        {/* 期限なしタスク */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">
            期限なしタスク (重要度順)
          </h2>
          {tasksWithNoDeadline.length > 0 ? (
            <ul className="space-y-3">
              {tasksWithNoDeadline.map(task => (
                <li
                  key={task.title}
                  className="bg-white shadow rounded p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-800">
                      {task.title}
                    </span>
                    <span className="text-sm text-gray-600">重要度: {task.importance}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">期限なしタスクはありません。</p>
          )}
        </section>

        {/* 期限付きタスク */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4 border-b pb-2">
            期限付きタスク (スコア順)
          </h2>
          {tasksWithDeadline.length > 0 ? (
            <ul className="space-y-3">
              {tasksWithDeadline.map(task => (
                <li
                  key={task.title}
                  className="bg-white shadow rounded p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <span className="text-lg font-medium text-gray-800">
                      {task.title}
                    </span>
                    <div className="mt-2 sm:mt-0 text-sm text-gray-600 space-x-2">
                      <span>スコア: {task.score.toFixed(2)}</span>
                      <span>|</span>
                      <span>重要度: {task.importance}</span>
                      <span>|</span>
                      <span>残り: {task.remainingHours.toFixed(1)}時間</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">期限付きタスクはありません。</p>
          )}
        </section>

        {/* カレンダー表示 */}
        <section className="mb-12">
          <CalendarWrapper tasks={tasks.filter(task => task.deadline !== null)} />
        </section>
      </div>
    </main>
  );
}
