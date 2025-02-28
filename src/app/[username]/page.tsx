// src/app/[username]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import TaskPage from '../components/TaskPage';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const { username } = useParams<{ username: string }>();

  // useEffect は必ず呼び出す
  useEffect(() => {
    if (!username) return; // username が存在しない場合は何もしない
    async function updateFcmToken() {
      // 実際は Firebase Messaging 等で取得した fcmToken を利用してください。
      const fcmToken = 'dummy_fcm_token'; // 実際のトークン取得ロジックに置き換え
      const { error } = await supabase
        .from('users')
        .upsert({ username: username, fcm_token: fcmToken }, { onConflict: 'username' });
      if (error) {
        console.error('FCMトークン更新エラー:', error);
      } else {
        console.log('FCMトークン更新成功');
      }
    }
    updateFcmToken();
  }, [username]);

  // username が未定義の場合のフォールバック
  if (!username) return <div>Loading...</div>;

  return <TaskPage username={username} />;
}
