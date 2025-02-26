// src/PushNotificationSetup.tsx
import React, { useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Firebase の設定情報 (Service Worker と同じもの)
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
  useEffect(() => {
    // Service Worker の登録
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${process.env.PUBLIC_URL}/firebase-messaging-sw.js`)
        .then((registration) => {
          console.log("Service Worker 登録成功:", registration);
          // messaging に Service Worker を関連付ける（Firebase v9 の場合は自動関連付けされることもあります）
        })
        .catch((error) => console.error("Service Worker 登録失敗:", error));
    }

    // 通知許可のリクエストとトークン取得
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        getToken(messaging, { vapidKey: "_EUSDLC1yGzXSs582ukCmR-dgf0fxUSGaePhtWFRt_Y" })
          .then((currentToken) => {
            if (currentToken) {
              console.log("FCM Token:", currentToken);
              // ここでトークンをバックエンドに送信して、プッシュ通知送信に利用する
            } else {
              console.warn("トークンが取得できませんでした。");
            }
          })
          .catch((err) => {
            console.error("トークン取得中にエラーが発生:", err);
          });
      } else {
        console.warn("通知の許可が得られませんでした。");
      }
    });

    // フォアグラウンドでの通知受信
    onMessage(messaging, (payload) => {
      console.log("フォアグラウンドメッセージ受信:", payload);
      // 必要に応じて UI の更新などを行う
      // 例: ブラウザ内に独自の通知表示を実装するなど
    });
  }, []);

  return <div>プッシュ通知の設定中...</div>;
};

export default PushNotificationSetup;
