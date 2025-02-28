"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
if (typeof window !== 'undefined' && !getApps().length) {
  initializeApp(firebaseConfig);
}

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Page() {
  const { username } = useParams<{ username: string }>();
  const [notificationAllowed, setNotificationAllowed] = useState(false);

  // 通知許可を促すUI（例：シンプルなボタン）
  const requestNotificationPermission = async () => {
    if (typeof window !== 'undefined' && Notification.permission !== "granted") {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          setNotificationAllowed(true);
        } else {
          console.warn("ユーザーは通知を拒否しました。");
        }
      } catch (err) {
        console.error("通知許可リクエストエラー:", err);
      }
    }
  };

  useEffect(() => {
    if (!username) return; // username が存在しない場合は何もしない

    // クライアント側でのみ実行するために window チェック
    if (typeof window === 'undefined') return;

    // ユーザーが通知を既に許可していればフラグをセット
    if (Notification.permission === "granted") {
      setNotificationAllowed(true);
    }
  }, [username]);

  useEffect(() => {
    if (!username) return;
    if (!notificationAllowed) {
      console.warn("通知が許可されていないため、FCM トークン更新をスキップします。");
      return;
    }

    async function updateFcmToken() {
      try {
        const messaging = getMessaging();
        const fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
        });
        if (!fcmToken) {
          console.warn("FCM registration token が取得できませんでした。");
          return;
        }
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
  }, [username, notificationAllowed]);

  if (!username) return <div>Loading...</div>;

  return (
    <>
      {!notificationAllowed && (
        <button onClick={requestNotificationPermission}>
          通知を許可する
        </button>
      )}
      <TaskPage username={username} />
    </>
  );
}
