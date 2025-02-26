import { sign } from "jsonwebtoken";

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

    // 環境変数からサービスアカウントキーを取得
    const serviceAccount = JSON.parse(
      await env.FIREBASE_SERVICE_ACCOUNT
    );

    // JWT を生成してアクセストークンを取得
    const accessToken = await getAccessToken(serviceAccount);

    // FCM に送るリクエストペイロード
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
    const response = await fetch(FCM_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    return new Response(responseText, { status: response.status });
  } catch (error) {
    return new Response(`Error: ${error}`, { status: 500 });
  }
}

// 🔹 JWT を生成して OAuth 2.0 アクセストークンを取得
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

  // JWT 署名を生成
  const jwt = sign(payload, serviceAccount.private_key, { algorithm: "RS256" });

  // Google のトークンエンドポイントにリクエストを送る
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const { access_token } = await tokenResponse.json();
  return access_token;
}
