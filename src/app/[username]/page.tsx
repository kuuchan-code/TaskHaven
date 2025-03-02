import { redirect } from "next/navigation";
import { createClient } from "../utils/supabase/server";
import LogoutButton from "../components/LogoutButton";
import TaskPage from "../components/TaskPage";

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  // params を await してから username を取得
  const { username } = await params;

  // utils/supabase/server.ts を利用して Supabase クライアントを作成
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ログインしていない、または URL の username とログインユーザーの username が異なる場合はリダイレクト
  if (!user || user.user_metadata.username !== username) {
    redirect("/");
  }

  return (
    <div>
      <LogoutButton />
      <TaskPage username={user.user_metadata.username} />
    </div>
  );
}
