import { NextResponse } from "next/server";
import { createClient } from "../../utils/supabase/server";

export const runtime = "edge";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 環境変数の確認
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // データベーステーブルの確認
    const { data: tables, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
    
    // usersテーブルの構造確認
    const { data: usersColumns, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    // ユーザー数の確認
    const { data: usersCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      env: {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      },
      database: {
        tablesResult: {
          success: !tablesError,
          tableNames: tables?.map(t => t.tablename) || [],
          error: tablesError ? tablesError.message : null
        },
        usersTable: {
          success: !usersError,
          columns: usersColumns ? Object.keys(usersColumns[0] || {}) : [],
          error: usersError ? usersError.message : null
        },
        usersCount: {
          success: !countError,
          count: usersCount?.length || 0,
          error: countError ? countError.message : null
        }
      }
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : '不明なエラー'
    }, { status: 500 });
  }
} 