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
      // 残り時間を計算（小数点以下も含む）。マイナスの場合は0日扱い、または最低1日として扱う。
      const diffTime = deadlineDate.getTime() - now.getTime();
      const remainingHours = Math.max(diffTime / (1000 * 60 * 60), 1);
      const score = task.importance * (1 / remainingHours) * ADJUSTMENT_FACTOR;
      return { ...task, remainingHours, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>タスク一覧</h1>

      <section>
        <h2>【期限なしタスク】 (Importance 降順)</h2>
        {tasksWithNoDeadline.length > 0 ? (
          <ul>
            {tasksWithNoDeadline.map(task => (
              <li key={task.title}>
                {task.title} - 重要度: {task.importance}
              </li>
            ))}
          </ul>
        ) : (
          <p>期限なしタスクはありません。</p>
        )}
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>【期限付きタスク】 (スコア降順: importance × 1/残り時間 × 調整係数)</h2>
        {tasksWithDeadline.length > 0 ? (
          <ul>
            {tasksWithDeadline.map(task => (
              <li key={task.title}>
                {task.title} - スコア: {task.score.toFixed(2)} (重要度: {task.importance}, 残り時間: {task.remainingHours.toFixed(1)})
              </li>
            ))}
          </ul>
        ) : (
          <p>期限付きタスクはありません。</p>
        )}
      </section>
    </main>
  );
}
