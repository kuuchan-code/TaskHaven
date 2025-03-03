// src/app/api/tasks/route.ts
export const runtime = "edge";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Task } from "../../types/taskTypes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  if (!username) {
    return NextResponse.json(
      { error: "username is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("username", username);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
  // data が配列であることを確認（Supabase は通常配列を返す）
  return NextResponse.json(data, { status: 200 });
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
