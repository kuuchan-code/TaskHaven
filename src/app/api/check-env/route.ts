import { NextResponse } from "next/server";

export async function GET() {
  // 環境変数が設定されているかチェック
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const envStatus = {
    supabaseUrl: !!supabaseUrl,
    supabaseAnonKey: !!supabaseAnonKey,
    allSet: !!supabaseUrl && !!supabaseAnonKey
  };
  
  return NextResponse.json(envStatus);
} 