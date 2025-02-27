/// <reference types="@cloudflare/workers-types" />

import { Auth, WorkersKVStoreSingle } from "firebase-auth-cloudflare-workers";
import { importPKCS8, SignJWT } from "jose";

// 環境変数用の型定義
interface Bindings {
  PROJECT_ID: string;
  PUBLIC_JWK_CACHE_KEY: string;
  PUBLIC_JWK_CACHE_KV: KVNamespace;
  FIREBASE_AUTH_EMULATOR_HOST: string;
  FIREBASE_SERVICE_ACCOUNT: string;
}

// リクエストボディ用の型定義
interface RequestPayload {
  fcmToken: string;
  title: string;
  priority: number;
}

export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Authorization ヘッダーから Firebase ID Token を取得
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Authorization header missing", { status: 401 });
    }
    const idToken = authHeader.replace(/Bearer\s+/i, "");

    // firebase-auth-cloudflare-workers を使って ID トークンを検証
    const auth = Auth.getOrInitialize(
      env.PROJECT_ID,
      WorkersKVStoreSingle.getOrInitialize(env.PUBLIC_JWK_CACHE_KEY, env.PUBLIC_JWK_CACHE_KV)
    );
    try {
      // 第2引数はリフレッシュトークンのチェック有無、env は第3引数に渡す
      await auth.verifyIdToken(idToken, false, env);
    } catch (err) {
      console.error("Firebase ID Token 検証エラー:", err);
      return new Response("Invalid Firebase ID token", { status: 401 });
    }

    try {
      // JSON パース時に型アサーションを利用
      const { fcmToken, title, priority } = (await request.json()) as RequestPayload;
      if (!fcmToken || !title || typeof priority !== "number") {
        return new Response("Missing parameters", { status: 400 });
      }

      // サービスアカウントの取得・解析
      let serviceAccount;
      try {
        const serviceAccountStr = env.FIREBASE_SERVICE_ACCOUNT;
        console.log("Service Account String:", serviceAccountStr);
        serviceAccount = JSON.parse(serviceAccountStr);
        console.log("Service Account Loaded Successfully:", serviceAccount.client_email);
      } catch (error) {
        console.error("ServiceAccount の取得・解析エラー:", error);
        return new Response(`ServiceAccount error: ${error}`, { status: 500 });
      }

      // アクセストークン取得
      let accessToken;
      try {
        accessToken = await getAccessToken(serviceAccount);
        console.log("Access Token:", accessToken);
      } catch (error) {
        console.error("アクセストークン取得エラー:", error);
        return new Response(`AccessToken error: ${error}`, { status: 500 });
      }

      // FCM に送るペイロード作成
      const payload = {
        message: {
          token: fcmToken,
          notification: {
            title: "高優先度タスク",
            body: `タスク「${title}」の優先度が ${priority.toFixed(2)} です。`
          }
        }
      };

      // FCM API へのリクエスト
      let notifyRes;
      try {
        notifyRes = await fetch("https://fcm.googleapis.com/v1/projects/my-tasks-af26d/messages:send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(payload)
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
};

/**
 * サービスアカウントの情報を元にアクセストークンを取得する関数
 */
async function getAccessToken(serviceAccount: any): Promise<string> {
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
        assertion: jwt
      })
    });
    // tokenData に対して型アサーションを実施
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      throw new Error(`No access token, response: ${JSON.stringify(tokenData)}`);
    }
    return tokenData.access_token;
  } catch (error) {
    console.error("JWT 生成またはアクセストークン取得エラー:", error);
    throw error;
  }
}
