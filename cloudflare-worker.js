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

      // サーバーの秘密鍵を環境変数から取得
      const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
      
      // アクセストークンを取得
      const accessToken = await getAccessToken(serviceAccount);

      // FCM メッセージの作成
      const payload = {
        message: {
          token: fcmToken,
          notification: {
            title: "高優先度タスク",
            body: `タスク「${title}」の優先度が ${priority.toFixed(2)} です。`
          }
        }
      };

      // FCM API へリクエスト送信
      const notifyRes = await fetch("https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const notifyText = await notifyRes.text();
      return new Response(notifyText, { status: notifyRes.status });

    } catch (error) {
      console.error("エラー:", error);
      return new Response(`Error: ${error}`, { status: 500 });
    }
  }
};

// アクセストークン取得関数
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

  const encoder = new TextEncoder();
  const keyData = encoder.encode(serviceAccount.private_key.replace(/\\n/g, "\n"));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, encoder.encode(JSON.stringify(payload)));

  const jwt = `${btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${btoa(JSON.stringify(payload))}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error(`No access token, response: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}
