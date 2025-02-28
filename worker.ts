// worker.ts
import { createClient } from '@supabase/supabase-js';
import { SchedulerLock } from './durable-objects';
export { SchedulerLock };  // Durable Object のエクスポートを追加

// Cloudflare Workers の scheduled イベント用ハンドラーと fetch ハンドラー
export default {
  async scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
    // Durable Object を利用して排他制御
    const id = env.SCHEDULER_LOCK.idFromName("singletonLock");
    const lockObject = env.SCHEDULER_LOCK.get(id);

    // ロック取得を試みる
    let acquireResponse = await lockObject.fetch("https://dummy/?action=acquire");
    if (acquireResponse.status === 200) {
      try {
        console.log("ロック取得成功。タスク処理を開始します。");
        await scheduled(event, env, ctx);  // 実際のタスク処理を呼び出す
      } catch (err) {
        console.error("タスク処理中にエラーが発生しました:", err);
      } finally {
        await lockObject.fetch("https://dummy/?action=release");
        console.log("ロック解放しました。");
      }
    } else {
      console.log("他のインスタンスが既に処理中のため、処理をスキップします。");
    }
  },
  async fetch(request: Request, env: any, ctx: ExecutionContext) {
    // HTTP リクエストが来た場合の処理（例えば 200 OK を返す）
    return new Response("This is a scheduled worker; no fetch endpoint is implemented.", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  },
};

/**
 * Cloudflare Workers の scheduled イベントで実行されるエントリポイント。
 * env には NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIREBASE_SERVICE_ACCOUNT (JSON文字列) を設定してください。
 */
export async function scheduled(event: ScheduledEvent, env: any, ctx: ExecutionContext) {
  // Supabase の初期化
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // firebase の service account 情報をパース
  const firebaseServiceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);

  // 優先度 2 以上かつ未完了のタスクを Supabase から取得
  const { data: tasks, error } = await supabase
    .from('task_with_priority')
    .select('*')
    .gte('priority', 2)
    .eq('completed', false);

  if (error) {
    console.error('タスク取得エラー:', error);
    return;
  }

  // firebase のアクセストークンを取得
  const firebaseAccessToken = await getFirebaseAccessToken(firebaseServiceAccount);

  // 各タスクに対して通知を送信
  for (const task of tasks) {
    // タスクに username が設定されているか確認
    if (!task.username) {
      console.warn(`タスク ${task.id} には username が設定されていないため通知をスキップします。`);
      continue;
    }

    // ユーザーの fcm_token と notifications_enabled を users テーブルから取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('fcm_token, notifications_enabled')
      .eq('username', task.username)
      .single();

    if (userError || !userData) {
      console.warn(`タスク ${task.id} に対応するユーザー ${task.username} の情報が取得できません。`);
      continue;
    }

    // ユーザーが通知オフの場合は通知をスキップ
    if (!userData.notifications_enabled) {
      console.log(`通知が無効のため、ユーザー ${task.username} に対する通知をスキップします。`);
      continue;
    }

    // fcm_token が存在しない場合もスキップ
    if (!userData.fcm_token) {
      console.warn(`ユーザー ${task.username} の fcm_token が存在しません。`);
      continue;
    }

    // 通知がオンかつトークンありの場合のみ送信
    const deviceToken = userData.fcm_token;
    await sendFCMNotification(task, deviceToken, firebaseAccessToken);
  }
}


/**
 * firebase の serviceAccountKey を用いてアクセストークンを取得する処理。
 * serviceAccount は JSON オブジェクトで、client_email, private_key, token_uri を含む前提です。
 */
async function getFirebaseAccessToken(serviceAccount: any): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600, // 有効期間 1 時間
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // private_key をインポートして署名処理
  const key = await importPrivateKey(serviceAccount.private_key);
  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: { name: "SHA-256" },
    },
    key,
    new TextEncoder().encode(signatureInput)
  );
  const encodedSignature = base64UrlEncode(new Uint8Array(signatureBuffer));
  const jwt = `${signatureInput}.${encodedSignature}`;

  // JWT を用いてアクセストークンを取得
  const tokenResponse = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json() as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error("アクセストークンの取得に失敗しました: " + JSON.stringify(tokenData));
  }
  return tokenData.access_token;
}

/**
 * PEM 形式の private_key を Web Crypto API で利用可能な CryptoKey に変換する関数。
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\n/g, "")
    .trim();
  const binaryDerString = atob(pemContents);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }
  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

/**
 * 文字列または Uint8Array を base64url エンコードする関数。
 */
function base64UrlEncode(input: string | Uint8Array): string {
  let str: string;
  if (typeof input === "string") {
    str = input;
  } else {
    let result = "";
    input.forEach((byte) => (result += String.fromCharCode(byte)));
    str = result;
  }
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * FCM の v1 API を利用して、指定タスクのプッシュ通知を送信する関数。
 * Firebase プロジェクトの ID は URL 内の my-tasks-af26d を実際のプロジェクト ID に置換してください。
 */
async function sendFCMNotification(task: any, deviceToken: string, firebaseAccessToken: string) {
  const payload = {
    message: {
      token: deviceToken,
      notification: {
        title: 'タスクリマインダー',
        body: `「${task.title}」がまだ完了していません。`,
      },
      data: {
        taskId: String(task.id),
      },
    },
  };

  const res = await fetch('https://fcm.googleapis.com/v1/projects/my-tasks-af26d/messages:send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firebaseAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  console.log(`タスク ${task.id} への通知送信結果:`, result);
}
