import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import InteractiveTaskDashboard from './components/InteractiveTaskDashboard';

export type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD" or "YYYY-MM-DD HH:mm" (null if no deadline)
};

async function getTasksFromGoogleSheets(): Promise<Task[]> {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(process.cwd(), "big-bison-388808-10558f7654da.json"),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  // 取得した認証クライアントを OAuth2Client にキャスト
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
    return [];
  }

  const [, ...data] = rows;
  const tasks: Task[] = data.map((row) => ({
    title: row[0],
    importance: Number(row[1]),
    deadline: row[2] ? row[2] : null,
  }));
  return tasks;
}

export default async function Page() {
  const tasks = await getTasksFromGoogleSheets();

  return (
    <main className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-12">
          タスク一覧
        </h1>
        <InteractiveTaskDashboard tasks={tasks} />
      </div>
    </main>
  );
}
