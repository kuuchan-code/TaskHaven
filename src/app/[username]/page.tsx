// src/app/[username]/page.tsx
"use client";

export const runtime = 'edge';


import { useParams } from 'next/navigation';
import TaskPage from '../components/TaskPage';

export default function Page() {
  const { username } = useParams<{ username: string }>();

  // usernameが未定義の場合のフォールバックも検討できます
  if (!username) return <div>Loading...</div>;

  return <TaskPage username={username} />;
}
