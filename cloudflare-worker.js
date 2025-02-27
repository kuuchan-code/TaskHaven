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
      const projectId = serviceAccount.project_id;
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

      const notifyRes = await fetch(fcmUrl, {
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

// PEM 形式の秘密鍵を ArrayBuffer に変換するヘルパー関数
function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// URL セーフな Base64 エンコードを行う関数
function base64UrlEncode(str) {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ArrayBuffer や Uint8Array を URL セーフな Base64 エンコードに変換する関数
function base64UrlEncodeBuffer(buffer) {
  // Uint8Array に変換
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return base64UrlEncode(binary);
}

// 修正済みの getAccessToken 関数
async function getAccessToken(serviceAccount) {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // 1時間有効

  // JWT ヘッダーとペイロードの定義
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp,
    iat,
  };

  // ヘッダーとペイロードの JSON 化と URL セーフな Base64 エンコード
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  // 署名対象の文字列作成
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // PEM 形式の秘密鍵を ArrayBuffer に変換
  const keyBuffer = pemToArrayBuffer(serviceAccount.private_key);

  // CryptoKey のインポート
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    keyBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // signingInput を署名
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signingInput)
  );

  // 署名も URL セーフな Base64 エンコード
  const encodedSignature = base64UrlEncodeBuffer(signatureBuffer);

  // JWT の完成
  const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;

  // OAuth 2.0 トークンのリクエスト
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
}
