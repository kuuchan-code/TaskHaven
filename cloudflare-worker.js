import { FlarebaseAuth } from "@marplex/flarebase-auth";

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

      // FlarebaseAuth の初期化
      const auth = new FlarebaseAuth({
        apiKey: env.FIREBASE_API_KEY,
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY,
        serviceAccountEmail: env.FIREBASE_SERVICE_ACCOUNT_EMAIL,
      });

      // OAuth アクセストークンの取得
      const accessToken = await auth.getOAuthToken();

      // FCM に送信するメッセージの作成
      const payload = {
        message: {
          token: fcmToken,
          notification: {
            title: "高優先度タスク",
            body: `タスク「${title}」の優先度が ${priority.toFixed(2)} です。`,
          },
        },
      };

      // FCM API にリクエストを送信
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/messages:send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();
      console.log("通知送信レスポンス:", response.status, responseText);
      return new Response(responseText, { status: response.status });

    } catch (error) {
      console.error("エラー:", error);
      return new Response(`Error: ${error}`, { status: 500 });
    }
  },
};
