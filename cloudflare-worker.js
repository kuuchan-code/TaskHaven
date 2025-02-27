import { initApp } from "@marplex/flarebase-auth";

// 環境変数からサービスアカウント情報を読み込み初期化
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const app = initApp({ serviceAccount });

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const { fcmToken, title, priority } = await request.json();
      if (!fcmToken || !title || typeof priority !== "number") {
        return new Response("Missing parameters", { status: 400 });
      }

      // FCM 送信用のメッセージペイロード作成
      const message = {
        token: fcmToken,
        notification: {
          title: "高優先度タスク",
          body: `タスク「${title}」の優先度が ${priority.toFixed(2)} です。`
        }
      };

      // @marplex/flarebase-auth の messaging() を利用して FCM 通知を送信
      const response = await app.messaging().send(message);
      console.log("通知送信成功:", response);
      return new Response(`Notification sent successfully: ${response}`, { status: 200 });
      
    } catch (error) {
      console.error("通知送信エラー:", error);
      return new Response(`Error: ${error}`, { status: 500 });
    }
  }
};
