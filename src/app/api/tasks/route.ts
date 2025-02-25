// src/app/api/tasks/route.ts
import { createClient, PostgrestError } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

// Initialize Supabase client
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
  // Mark _request as used
  void _request;

  // Remove generics from .from() and use a type assertion on the result
  const { data, error } = await supabase
    .from('tasks')
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
