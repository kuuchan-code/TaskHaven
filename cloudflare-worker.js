export default {
  async fetch(request, env, ctx) {
    try {
      // シークレットからサービスアカウント情報を取得
      const serviceAccountStr = env.FIREBASE_SERVICE_ACCOUNT;
      console.log("Service Account String:", serviceAccountStr);
      const serviceAccount = JSON.parse(serviceAccountStr);
      console.log("Service Account Loaded Successfully:", serviceAccount.client_email);

      // アクセストークンを取得
      const accessToken = await getAccessToken(serviceAccount);
      console.log("Access Token:", accessToken);

      // リクエストボディから fcmToken, title, priority を取得
      const { fcmToken, title, priority } = await request.json();
      console.log("FCM Token:", fcmToken, "Title:", title, "Priority:", priority);

      // FCMメッセージのペイロード作成
      const fcmMessage = {
        message: {
          token: fcmToken, // 受信デバイスのトークン
          notification: {
            title: title,
            body: "これはテストメッセージです。"  // 必要に応じて本文もパラメータ化可
          },
        }
      };

      // サービスアカウントからプロジェクトIDを取得
      const projectId = serviceAccount.project_id;
      // FCMエンドポイントに対してリクエスト送信
      const fcmResponse = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(fcmMessage)
        }
      );

      const fcmResult = await fcmResponse.json();
      console.log("FCM Response:", fcmResult);

      return new Response("FCMリクエスト送信成功", { status: 200 });
    } catch (error) {
      console.error("Error sending FCM request:", error);
      return new Response(`Error: ${error}`, { status: 500 });
    }
  }
};

import { importPKCS8, SignJWT } from "jose";

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

  try {
    // PEM形式の秘密鍵をCryptoKeyに変換
    const cryptoKey = await importPKCS8(serviceAccount.private_key, "RS256");

    const jwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .sign(cryptoKey);

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
