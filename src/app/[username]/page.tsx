// src/app/[username]/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "../utils/supabase/server";
import LogoutButton from "../components/LogoutButton";
import TaskPage from "../components/TaskPage";

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
