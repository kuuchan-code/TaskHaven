/* eslint-disable @typescript-eslint/no-unused-vars */
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';

export type Task = {
  title: string;
  importance: number;
  deadline: string | null;
};

export async function GET(request: Request) {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(process.cwd(), "big-bison-388808-10558f7654da.json"),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = (await auth.getClient()) as OAuth2Client;
    const sheets = google.sheets({ version: 'v4', auth: client });

    const spreadsheetId = process.env.SPREADSHEET_ID as string;
    const range = 'Sheet1!A:C';

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const [, ...data] = rows;
    const tasks: Task[] = data.map((row: string[]) => ({
      title: row[0],
      importance: Number(row[1]),
      deadline: row[2] ? row[2] : null,
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
