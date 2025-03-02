// src/app/api/updateWebhook/route.ts
export const runtime = "edge";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const { username, webhook_url, notification_interval } = await request.json();

    if (!username || webhook_url === undefined || notification_interval === undefined) {
      return NextResponse.json(
        { message: "username, webhook_url と notification_interval は必須です" },
        { status: 400 }
      );
    }

    if (webhook_url === "") {
      const { data, error } = await supabase
        .from("users")
        .update({ webhook_url: null, notification_interval: null })
        .eq("username", username);

      if (error) {
        return NextResponse.json({ message: "通知無効化中にエラーが発生しました", error }, { status: 500 });
      }
      return NextResponse.json({ message: "通知が無効化されました", data }, { status: 200 });
    }

    const { data, error } = await supabase
      .from("users")
      .upsert({ username, webhook_url, notification_interval }, { onConflict: "username" })
      .select();

    if (error) {
      return NextResponse.json({ message: "更新エラー", error }, { status: 500 });
    }
    return NextResponse.json({ message: "Webhook URL と通知間隔が更新されました", data }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "リクエスト処理中にエラーが発生しました", error }, { status: 500 });
  }
}
