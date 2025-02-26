export const runtime = 'edge';

import { createClient, PostgrestError } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

// Supabase クライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export type Task = {
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
  // クエリパラメータから source を取得（未指定の場合はデフォルトの "kuu" 相当として tasks を利用）
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

export async function PUT(request: Request) {
  const { id, title, importance, deadline, completed, source } = await request.json();
  const tableName = getTableName(source);

  // 更新するデータオブジェクトを構築（completed が指定されていれば更新対象に含める）
  const updateData: any = { title, importance, deadline };
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

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
