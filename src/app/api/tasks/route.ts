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
  username: string;
  // CREATE OR REPLACE VIEW task_with_priority AS
  // SELECT
  //   id,
  //   username,
  //   title,
  //   importance,
  //   deadline,
  //   completed,
  //   CASE
  //     WHEN deadline IS NULL THEN NULL
  //     WHEN EXTRACT(EPOCH FROM (deadline - CURRENT_TIMESTAMP)) / 3600 >= 0 THEN
  //       importance / POWER((EXTRACT(EPOCH FROM (deadline - CURRENT_TIMESTAMP)) / 3600 + 1), 0.5)
  //     ELSE
  //       importance
  //   END AS priority
  // FROM tasks;
  priority?: number;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  if (!username) {
    return new Response(
      JSON.stringify({ error: "username is required" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from("task_with_priority")
    .select('*')
    .eq('username', username) as { data: Task[] | null; error: PostgrestError | null };

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
  // 型定義を追加して request.json() の戻り値をキャスト
  type PostBody = {
    title: string;
    importance: number;
    deadline: string | null;
    username: string;
  };

  const { title, importance, deadline, username } = await request.json() as PostBody;

  if (!username) {
    return new Response(
      JSON.stringify({ error: "username is required" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from("task_with_priority")
    .insert([{ title, importance, deadline, username }]);

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
  // 型定義を追加して request.json() の戻り値をキャスト
  type DeleteBody = {
    id: number;
    username: string;
  };

  const { id, username } = await request.json() as DeleteBody;

  if (!username) {
    return new Response(
      JSON.stringify({ error: "username is required" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await supabase
    .from("task_with_priority")
    .delete()
    .eq('id', id)
    .eq('username', username);

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
  // 型定義を追加して request.json() の戻り値をキャスト
  type PutBody = UpdateTask & {
    id: number;
    username: string;
  };

  const { id, title, importance, deadline, completed, username } = await request.json() as PutBody;

  if (!username) {
    return new Response(
      JSON.stringify({ error: "username is required" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const updateData: UpdateTask = { title, importance, deadline };
  if (typeof completed !== 'undefined') {
    updateData.completed = completed;
  }

  const { data, error } = await supabase
    .from("task_with_priority")
    .update(updateData)
    .eq('id', id)
    .eq('username', username);

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
