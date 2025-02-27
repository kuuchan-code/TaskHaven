// src/app/components/PushNotificationSetup.tsx
import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase の設定情報
const firebaseConfig = {
  apiKey: "AIzaSyC54PbL4kpTeKIrY3jXQMJ5335pWz1BbzM",
  authDomain: "my-tasks-af26d.firebaseapp.com",
  projectId: "my-tasks-af26d",
  storageBucket: "my-tasks-af26d.firebasestorage.app",
  messagingSenderId: "529762432667",
  appId: "1:529762432667:web:3e57bcc886100d801b383e"
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const PushNotificationSetup: React.FC = () => {
  const [status, setStatus] = useState("プッシュ通知の設定中...");

  useEffect(() => {
    // Service Worker の登録
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          console.log("Service Worker 登録成功:", registration);
        })
        .catch((error) => {
          console.error("Service Worker 登録失敗:", error);
          setStatus("Service Worker の登録に失敗しました");
        });
    }

    // 通知許可のリクエストとトークン取得
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        getToken(messaging, { vapidKey: "BAtGmxTOUuZeXbCVaUCSeqgjdgh9Rd8Q2yoogBASjrUC9ep1vXDO5igfmG30QwzFVAkJR8mdG_O_ATlZq3Vueos" })
          .then((currentToken) => {
            if (currentToken) {
              console.log("FCM Token:", currentToken);
              localStorage.setItem("fcmToken", currentToken);
              setStatus("プッシュ通知の設定が完了しました");
              // 必要なら、ここでトークンをバックエンドに送信する処理を追加
            } else {
              console.warn("FCM トークンが取得できませんでした。");
              setStatus("FCM トークンが取得できませんでした");
            }
          })
          .catch((err) => {
            console.error("トークン取得中にエラーが発生:", err);
            setStatus("トークン取得中にエラーが発生しました");
          });
      } else {
        console.warn("通知の許可が得られませんでした。");
        setStatus("通知の許可が得られませんでした");
      }
    });

    // フォアグラウンドでの通知受信時に、ブラウザの Notification API を使って表示する
    onMessage(messaging, (payload) => {
      console.log("フォアグラウンドメッセージ受信:", payload);
      if (Notification.permission === "granted" && payload.notification) {
        const title = payload.notification.title || "通知";
        new Notification(title, {
          body: payload.notification.body || "",
          // icon やその他オプションを必要に応じて追加
        });
      }
    });
    
  }, []);

  return <div>{status}</div>;
};

export default PushNotificationSetup;
