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
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          タスク一覧
        </h1>

        {/* 期限なしタスク */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
            期限なしタスク (重要度順)
          </h2>
          {tasksWithNoDeadline.length > 0 ? (
            <ul className="space-y-4">
              {tasksWithNoDeadline.map(task => (
                <li
                  key={task.title}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                      {task.title}
                    </span>
                    <span className="text-base text-gray-600 dark:text-gray-300">
                      重要度: {task.importance}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">期限なしタスクはありません。</p>
          )}
        </section>

        {/* 期限付きタスク */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
            期限付きタスク (スコア順)
          </h2>
          {tasksWithDeadline.length > 0 ? (
            <ul className="space-y-4">
              {tasksWithDeadline.map(task => (
                <li
                  key={task.title}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                      {task.title}
                    </span>
                    <div className="mt-4 sm:mt-0 text-base text-gray-600 dark:text-gray-300 space-x-4">
                      <span>スコア: {task.score.toFixed(2)}</span>
                      <span>重要度: {task.importance}</span>
                      <span>残り: {task.remainingHours.toFixed(1)}時間</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">期限付きタスクはありません。</p>
          )}
        </section>

        {/* カレンダー表示 */}
        <section className="mb-12">
          <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
            カレンダー表示
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 ">
            <CalendarWrapper tasks={tasks.filter(task => task.deadline !== null)} />
          </div>
        </section>
      </div>
    </main>
  );
}
