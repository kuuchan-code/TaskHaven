// src/app/api/tasks/route.ts
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

export async function GET(_request: NextRequest) {
  void _request;

  const { data, error } = await supabase
    .from('kuu')
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
  const { title, importance, deadline } = await request.json();
  const { data, error } = await supabase
    .from('tasks')
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

export async function PUT(request: Request) {
  const { id, title, importance, deadline } = await request.json();
  const { data, error } = await supabase
    .from('tasks')
    .update({ title, importance, deadline })
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

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const { data, error } = await supabase
    .from('tasks')
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
