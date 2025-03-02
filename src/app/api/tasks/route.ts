// src/app/api/tasks/route.ts
export const runtime = "edge";
import { createClient, PostgrestError } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

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
  priority?: number;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) {
    return new Response(
      JSON.stringify({ error: "username is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // tasks テーブルから completed_at も含むすべてのカラムを取得する
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("username", username);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}


export async function POST(request: Request) {
  const { title, importance, deadline, username } = await request.json();
  if (!username) {
    return new Response(JSON.stringify({ error: "username is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ title, importance, deadline, username }]);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify(data), { status: 201, headers: { "Content-Type": "application/json" } });
}

export async function DELETE(request: Request) {
  const { id, username } = await request.json();
  if (!username) {
    return new Response(JSON.stringify({ error: "username is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("username", username);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}

interface UpdateTask {
  title: string;
  importance: number;
  deadline: string | null;
  completed?: boolean;
  completed_at?: string | null;
}

export async function PUT(request: Request) {
  const { id, title, importance, deadline, completed, username } = await request.json();
  if (!username) {
    return new Response(JSON.stringify({ error: "username is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const updateData: UpdateTask = { title, importance, deadline };

  if (typeof completed !== "undefined") {
    updateData.completed = completed;
    // 完了の場合は完了日時を設定し、再オープンの場合は null にする
    updateData.completed_at = completed ? new Date().toISOString() : null;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id)
    .eq("username", username);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}
