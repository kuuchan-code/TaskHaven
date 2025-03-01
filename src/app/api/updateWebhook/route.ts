// app/api/updateWebhook/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, webhook_url, notification_interval } = body;

    if (!username || !webhook_url || notification_interval === undefined) {
      return NextResponse.json(
        { message: 'username, webhook_url と notification_interval は必須です' },
        { status: 400 }
      );
    }

    // upsert を利用して、ユーザーが存在しない場合は新規作成、存在する場合は更新する
    const { data, error } = await supabase
      .from('users')
      .upsert({ username, webhook_url, notification_interval }, { onConflict: 'username' })
      .select();

    if (error) {
      console.error("更新エラー", error);
      return NextResponse.json(
        { message: '更新エラー', error },
        { status: 500 }
      );
    }

    console.log("更新成功:", data);
    return NextResponse.json(
      { message: 'Webhook URL と通知間隔が更新されました', data },
      { status: 200 }
    );
  } catch (error) {
    console.error("リクエスト処理エラー", error);
    return NextResponse.json(
      { message: 'リクエスト処理中にエラーが発生しました', error },
      { status: 500 }
    );
  }
}
