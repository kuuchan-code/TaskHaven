// cloudflare-worker.js
addEventListener("fetch", (event) => {
    event.respondWith(handleRequest(event.request));
  });
  
  const FCM_API_URL = "https://fcm.googleapis.com/v1/projects/my-tasks-af26d/messages:send";
  
  async function handleRequest(request) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }
  
    try {
      const { fcmToken, title, priority } = await request.json();
      if (!fcmToken || !title || typeof priority !== "number") {
        return new Response("Missing parameters", { status: 400 });
      }
  
      // サービスアカウントの取得と解析
      let serviceAccount;
      try {
        const serviceAccountStr = await env.FIREBASE_SERVICE_ACCOUNT;
        console.log("Service Account String:", serviceAccountStr);
        serviceAccount = JSON.parse(serviceAccountStr);
      } catch (error) {
        console.error("ServiceAccount の取得・解析エラー:", error);
        return new Response(`ServiceAccount error: ${error}`, { status: 500 });
      }
  
      // JWT の生成とアクセストークンの取得
      let accessToken;
      try {
        accessToken = await getAccessToken(serviceAccount);
      } catch (error) {
        console.error("アクセストークン取得エラー:", error);
        return new Response(`AccessToken error: ${error}`, { status: 500 });
      }
  
      // FCM に送るリクエストペイロード作成
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
      let notifyRes;
      try {
        notifyRes = await fetch(FCM_API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error("FCM API へのリクエストエラー:", error);
        return new Response(`FCM API request error: ${error}`, { status: 500 });
      }
  
      const notifyText = await notifyRes.text();
      console.log("通知送信レスポンス:", notifyRes.status, notifyText);
      return new Response(notifyText, { status: notifyRes.status });
    } catch (error) {
      console.error("Worker 内部エラー:", error);
      return new Response(`Error: ${error}`, { status: 500 });
    }
  }
  
  // JWT を生成して OAuth 2.0 アクセストークンを取得
  import { SignJWT } from 'jose';
  async function getAccessToken(serviceAccount) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 3600; // 1時間有効
  
    const payload = {
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/cloud-platform",
      aud: "https://oauth2.googleapis.com/token",
      exp,
      iat,
    };
  
    const privateKey = serviceAccount.private_key.replace(/\\n/g, "\n");
  
    try {
      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .sign(new TextEncoder().encode(privateKey));
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: jwt,
        }),
      });
      const tokenData = await tokenResponse.json();
      if (!tokenData.access_token) {
        throw new Error(`No access token, response: ${JSON.stringify(tokenData)}`);
      }
      return tokenData.access_token;
    } catch (error) {
      console.error("JWT 生成またはアクセストークン取得エラー:", error);
      throw error;
    }
  }
  