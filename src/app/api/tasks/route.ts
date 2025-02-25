export const runtime = 'edge';
/* eslint-disable @typescript-eslint/no-unused-vars */
export type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD" or "YYYY-MM-DD HH:mm" (null if no deadline)
};

export async function GET(request: Request) {
  // 環境変数からスプレッドシートのIDと API キーを取得
  const spreadsheetId = process.env.SPREADSHEET_ID;
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const range = 'Sheet1!A:D';

  if (!spreadsheetId || !apiKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SPREADSHEET_ID or GOOGLE_SHEETS_API_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Google Sheets API のエンドポイント URL を構築
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }
    const json = await response.json();
    const rows = json.values;
    if (!rows || rows.length < 2) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1行目はヘッダーと想定し、2行目以降をデータとして変換
    const [, ...data] = rows;
    const tasks: Task[] = data.map((row: string[]) => ({
      title: row[0],
      importance: Number(row[1]),
      deadline: row[3] ? row[3] : null,
    }));

    return new Response(JSON.stringify(tasks), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
