// src/app/[username]/page.tsx
"use client";

import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import TaskPage from '../components/TaskPage';
import { createClient } from '@supabase/supabase-js';

// Firebase 関連のインポート
import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyC54PbL4kpTeKIrY3jXQMJ5335pWz1BbzM",
  authDomain: "my-tasks-af26d.firebaseapp.com",
  projectId: "my-tasks-af26d",
  storageBucket: "my-tasks-af26d.firebasestorage.app",
  messagingSenderId: "529762432667",
  appId: "1:529762432667:web:3e57bcc886100d801b383e"
};

// Firebase App の初期化（すでに初期化済みの場合はスキップ）
if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const messaging = getMessaging();

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const { username } = useParams<{ username: string }>();

  useEffect(() => {
    if (!username) return; // username が存在しない場合は何もしない

    async function updateFcmToken() {
      try {
        // Firebase Messaging から FCM トークンを取得する
        const fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
        });
        if (!fcmToken) {
          console.warn("FCM registration token が取得できませんでした。");
          return;
        }
        // Supabase の users テーブルに対して upsert
        const { error } = await supabase
          .from('users')
          .upsert({ username: username, fcm_token: fcmToken }, { onConflict: 'username' });
        if (error) {
          console.error('FCMトークン更新エラー:', error);
        } else {
          console.log('FCMトークン更新成功:', fcmToken);
        }
      } catch (err) {
        console.error("FCMトークン取得エラー:", err);
      }
    }
    updateFcmToken();
  }, [username]);

  if (!username) return <div>Loading...</div>;

  return <TaskPage username={username} />;
}
