// src/app/api/user/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    if (!username) {
      return NextResponse.json({ message: "username パラメータは必須です" }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("users")
      .select("username, webhook_url, notification_interval")
      .eq("username", username)
      .single();
    if (error) {
      return NextResponse.json({ message: "ユーザー情報の取得に失敗しました", error }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ message: "リクエスト処理中にエラーが発生しました", error }, { status: 500 });
  }
}
