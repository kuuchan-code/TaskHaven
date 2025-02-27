// src/app/[username]/page.tsx
export const runtime = 'edge';

"use client";

import { useParams } from 'next/navigation';
import TaskPage from '../components/TaskPage';

export default function Page() {
  const { username } = useParams<{ username: string }>();

  // usernameが未定義の場合のフォールバックも検討できます
  if (!username) return <div>Loading...</div>;

  return <TaskPage username={username} />;
}
