// src/app/api/fcm-tokens/route.ts
export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface FcmTokenRequest {
    username: string;
    fcmToken: string;
}

interface FcmTokenDeleteRequest {
    username: string;
    fcmToken: string;
}
// FCMトークンの登録・更新 (upsert)
export async function POST(request: Request) {
    const { username, fcmToken } = (await request.json()) as FcmTokenRequest; if (!username || !fcmToken) {
        return new Response(
            JSON.stringify({ error: "username と fcmToken は必須です" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const { data, error } = await supabase
        .from("fcm_tokens")
        .upsert({
            username,
            fcm_token: fcmToken,
            last_updated: new Date().toISOString()
        });

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

// usernameに紐づくFCMトークンを取得
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    if (!username) {
        return new Response(
            JSON.stringify({ error: "username は必須です" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const { data, error } = await supabase
        .from("fcm_tokens")
        .select('*')
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

// FCMトークンの削除
export async function DELETE(request: Request) {
    const { username, fcmToken } = (await request.json()) as FcmTokenDeleteRequest; if (!username || !fcmToken) {
        return new Response(
            JSON.stringify({ error: "username と fcmToken は必須です" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const { data, error } = await supabase
        .from("fcm_tokens")
        .delete()
        .eq('username', username)
        .eq('fcm_token', fcmToken);

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
