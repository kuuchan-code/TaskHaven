// app/page.tsx
import { promises as fs } from 'fs';
import path from 'path';

type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD" or null
};

export default async function Page() {
  // publicディレクトリ内の tasks.json を読み込む
  const filePath = path.join(process.cwd(), 'public', 'tasks.json');
  const jsonData = await fs.readFile(filePath, 'utf8');
  const tasks: Task[] = JSON.parse(jsonData);

  // (1) deadlineがnullのタスクを importance 降順にソート
  const tasksWithNoDeadline = tasks
    .filter(task => task.deadline === null)
    .sort((a, b) => b.importance - a.importance);

  // (2) 期限が設定されているタスクについて、残り時間の逆数×importance×調整係数でスコア計算
  const ADJUSTMENT_FACTOR = 24; // 必要に応じて調整
  const now = new Date();
  const tasksWithDeadline = tasks
    .filter(task => task.deadline !== null)
    .map(task => {
      const deadlineDate = new Date(task.deadline as string);
      // 残り時間を計算（小数点以下も含む）。マイナスの場合は最低1時間として扱う。
      const diffTime = deadlineDate.getTime() - now.getTime();
      const remainingHours = Math.max(diffTime / (1000 * 60 * 60), 1);
      const score = task.importance * (1 / remainingHours) * ADJUSTMENT_FACTOR;
      return { ...task, remainingHours, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">タスク一覧</h1>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            期限なしタスク (Importance 降順)
          </h2>
          {tasksWithNoDeadline.length > 0 ? (
            <ul className="bg-white shadow rounded divide-y divide-gray-200">
              {tasksWithNoDeadline.map(task => (
                <li key={task.title} className="p-4 hover:bg-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-800">{task.title}</span>
                    <span className="text-sm text-gray-600">重要度: {task.importance}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">期限なしタスクはありません。</p>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            期限付きタスク (スコア降順: importance × 1/残り時間 × 調整係数)
          </h2>
          {tasksWithDeadline.length > 0 ? (
            <ul className="bg-white shadow rounded divide-y divide-gray-200">
              {tasksWithDeadline.map(task => (
                <li key={task.title} className="p-4 hover:bg-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <span className="text-lg font-medium text-gray-800">{task.title}</span>
                    <div className="mt-2 sm:mt-0 text-sm text-gray-600">
                      <span>スコア: {task.score.toFixed(2)}</span>
                      <span className="mx-2">|</span>
                      <span>重要度: {task.importance}</span>
                      <span className="mx-2">|</span>
                      <span>残り時間: {task.remainingHours.toFixed(1)}時間</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">期限付きタスクはありません。</p>
          )}
        </section>
      </div>
    </main>
  );
}
