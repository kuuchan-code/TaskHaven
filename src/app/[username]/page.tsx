// src/app/[username]/page.tsx
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import LogoutButton from "../components/LogoutButton"; // 後述のクライアントコンポーネント
import TaskPage from "../components/TaskPage";

export default async function UserPage({ params }: { params: { username: string } }) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  // ログインしていない場合、またはログインユーザーの username が URL と一致しない場合はリダイレクト
  if (!user || user.user_metadata.username !== params.username) {
    redirect("/");
  }

  return (
    <div>
      <LogoutButton />
      <TaskPage username={user.user_metadata.username} />
    </div>
  );
}
