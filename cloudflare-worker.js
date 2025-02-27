export default {
    async fetch(request, env, ctx) {
      try {
        // シークレットの取得
        const serviceAccountStr = env.FIREBASE_SERVICE_ACCOUNT;
        console.log("Service Account String:", serviceAccountStr);
  
        // JSONパース
        const serviceAccount = JSON.parse(serviceAccountStr);
  
        console.log("Service Account Loaded Successfully:", serviceAccount.client_email);
  
        // アクセストークン取得の例
        const accessToken = await getAccessToken(serviceAccount);
        console.log("Access Token:", accessToken);
  
        return new Response("成功", { status: 200 });
      } catch (error) {
        console.error("ServiceAccount の取得・解析エラー:", error);
        return new Response(`ServiceAccount error: ${error}`, { status: 500 });
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
      // PEM形式の秘密鍵をそのまま使用して CryptoKey に変換する
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
  