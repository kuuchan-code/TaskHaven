"use client";

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import TaskPage from '../components/TaskPage';
import { createClient } from '@supabase/supabase-js';
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

if (typeof window !== 'undefined' && !getApps().length) {
  initializeApp(firebaseConfig);
}

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 通知設定を更新する関数
async function updateNotificationSetting(username: string, enabled: boolean) {
  const { error } = await supabase
    .from('users')
    .update({ notifications_enabled: enabled })
    .eq('username', username);
  if (error) {
    console.error('通知設定更新エラー:', error);
  } else {
    console.log('通知設定更新成功:', enabled);
  }
}

export default function Page() {
  const { username } = useParams<{ username: string }>();
  const [notificationAllowed, setNotificationAllowed] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean | null>(null);

  // ブラウザの通知許可を促す UI
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

  // 初期化時にブラウザの通知許可状態とユーザーごとの通知設定を取得
  useEffect(() => {
    if (!username) return;
    if (typeof window === 'undefined') return;

    if (Notification.permission === "granted") {
      setNotificationAllowed(true);
    }
    
    async function fetchNotificationSetting() {
      const { data, error } = await supabase
        .from('users')
        .select('notifications_enabled')
        .eq('username', username)
        .single();
      if (error) {
        console.error("通知設定の取得エラー:", JSON.stringify(error));      } else {
        setNotificationsEnabled(data.notifications_enabled);
      }
    }
    fetchNotificationSetting();
  }, [username]);

  // サービスワーカーの重複登録を防ぐ
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        const alreadyRegistered = registrations.some((registration) =>
          registration.active && registration.active.scriptURL.includes('firebase-messaging-sw.js')
        );
        if (!alreadyRegistered) {
          navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((reg) => {
              console.log('Service Worker registered:', reg);
            })
            .catch((err) => {
              console.error('Service Worker registration failed:', err);
            });
        } else {
          console.log('Service Worker already registered');
        }
      });
    }
  }, []);

  // 通知が許可されている場合に FCM トークンの更新を実施（ユーザー設定も確認）
  useEffect(() => {
    if (!username) return;
    if (!notificationAllowed) {
      console.warn("ブラウザで通知が許可されていないため、FCM トークン更新をスキップします。");
      return;
    }
    if (notificationsEnabled === false) {
      console.log("ユーザー設定で通知が無効のため、FCM トークン更新をスキップします。");
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
  }, [username, notificationAllowed, notificationsEnabled]);

  // ユーザーごとの通知設定トグル
  const toggleNotifications = async () => {
    const newSetting = !notificationsEnabled;
    setNotificationsEnabled(newSetting);
    await updateNotificationSetting(username!, newSetting);
  };

  if (!username) return <div>Loading...</div>;

  return (
    <>
      {!notificationAllowed && (
        <button onClick={requestNotificationPermission}>
          ブラウザ通知を許可する
        </button>
      )}
      {notificationAllowed && notificationsEnabled !== null && (
        <div>
          <p>通知設定: {notificationsEnabled ? "有効" : "無効"}</p>
          <button onClick={toggleNotifications}>
            {notificationsEnabled ? "通知を無効にする" : "通知を有効にする"}
          </button>
        </div>
      )}
      <TaskPage username={username} />
    </>
  );
}
