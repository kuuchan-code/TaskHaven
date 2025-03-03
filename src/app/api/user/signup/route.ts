import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const { userId, username, email, created_at } = await request.json();

    if (!userId || !username || !email) {
      return NextResponse.json(
        { 
          success: false, 
          message: "必須パラメータが不足しています" 
        }, 
        { status: 400 }
      );
    }

    // サインアップ前に重複チェックを行う
    const { data: existingUser } = await supabase
      .from("users")
      .select("username, email")
      .or(`username.eq.${username},email.eq.${email.toLowerCase()}`)
      .maybeSingle();

    if (existingUser) {
      // 重複するフィールドを特定
      const duplicateFields = [];
      if (existingUser.username === username) duplicateFields.push("username");
      if (existingUser.email === email.toLowerCase()) duplicateFields.push("email");
      
      return NextResponse.json(
        {
          success: false,
          message: "ユーザー情報が既に存在します",
          duplicateFields,
          error: {
            code: "23505", // PostgreSQLの一意性制約違反エラーコード
            message: `${duplicateFields.join("と")}が既に使用されています`
          }
        },
        { status: 409 } // 409 Conflict - リソースの競合を示すHTTPステータスコード
      );
    }

    // サービスロールを使用してusersテーブルにデータを挿入
    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          id: userId,
          username,
          email: email.toLowerCase(),
          created_at: created_at || new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("ユーザープロフィール作成エラー:", error);
      
      // PostgreSQLのエラーコードを確認して、より具体的なエラーメッセージを返す
      if (error.code === '23505') { // 一意性制約違反
        let errorMessage = "ユーザー情報が既に存在します";
        let duplicateField = "username"; // デフォルト
        
        // エラーメッセージから重複しているフィールドを特定
        if (error.message && error.message.includes("users_email_key")) {
          duplicateField = "email";
          errorMessage = "このメールアドレスは既に使用されています";
        } else if (error.message && error.message.includes("users_username_key")) {
          errorMessage = "このユーザー名は既に使用されています";
        }
        
        return NextResponse.json(
          { 
            success: false, 
            message: errorMessage,
            duplicateField,
            error 
          }, 
          { status: 409 } // 409 Conflict
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: "ユーザーデータの作成に失敗しました", 
          error 
        }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "ユーザーデータが正常に作成されました", 
      data 
    });
  } catch (error) {
    console.error("サーバーエラー:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "リクエスト処理中にエラーが発生しました", 
        error 
      }, 
      { status: 500 }
    );
  }
} 