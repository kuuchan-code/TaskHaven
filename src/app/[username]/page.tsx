import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import LogoutButton from "../components/LogoutButton";
import TaskPage from "../components/TaskPage";

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  // Await params before accessing its properties
  const { username } = await params;

  // Ensure Supabase gets the correct format
  const supabase = createServerComponentClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in or the URL username doesn't match the logged-in user, redirect
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
