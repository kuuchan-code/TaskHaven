// src/app/api/tasks/route.ts
export const runtime = 'edge';

import { createClient, PostgrestError } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

// Supabase クライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type Task = {
  completed: boolean;
  id: number;
  title: string;
  importance: number;
  deadline: string | null;
};


// クライアントから渡された source に応じたテーブル名の決定
const getTableName = (source: string | null) => {
  if (!source) {
    throw new Error("source is required");
  }
  return source;
};


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const tableName = getTableName(source);

  const { data, error } = await supabase
    .from(tableName)
    .select('*') as { data: Task[] | null; error: PostgrestError | null };

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request: Request) {
  const { title, importance, deadline, source } = await request.json();
  const tableName = getTableName(source);

  const { data, error } = await supabase
    .from(tableName)
    .insert([{ title, importance, deadline }]);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}


export async function DELETE(request: Request) {
  const { id, source } = await request.json();
  const tableName = getTableName(source);

  const { data, error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

interface UpdateTask {
  title: string;
  importance: number;
  deadline: string | null;
  completed?: boolean;
}

export async function PUT(request: Request) {
  const { id, title, importance, deadline, completed, source, fcmToken } = await request.json();
  const tableName = getTableName(source);

  // 更新するデータオブジェクトの型を明示
  const updateData: UpdateTask = { title, importance, deadline };
  if (typeof completed !== 'undefined') {
    updateData.completed = completed;
  }

  const { data, error } = await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', id);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // たとえば、重要度が一定以上の場合に通知を送信する
  const HIGH_PRIORITY_THRESHOLD = 2;
  if (importance >= HIGH_PRIORITY_THRESHOLD && fcmToken) {
    try {
      await fetch("https://my-tasks-worker.kuuchanxn.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fcmToken,  // ユーザーごとの FCM トークン
          title,     // タスクタイトル
          priority: importance,
        }),
      });
      console.log("高優先度タスクの通知を送信しました");
    } catch (notifyError) {
      console.error("通知送信エラー:", notifyError);
    }
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}