import "jsr:@supabase/functions-js/edge-runtime.d.ts";
const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");

async function notifyHighPriorityTasks() {
  const tasks = await fetchTasksWithHighPriority();
  if (!Array.isArray(tasks)) {
    console.error("Unexpected response format", tasks);
    return;
  }
  for (const task of tasks) {
    const remainingTime = calculateRemainingTime(task.deadline);
    const message = `Task: ${task.title} | Priority: ${task.priority} | Remaining Time: ${remainingTime}`;
    await sendDiscordNotification(message);
  }
}

async function fetchTasksWithHighPriority() {
  // 条件: completed が false かつ priority が 1 以上、さらに priority 順にソート（降順）
  const response = await fetch("https://gmzfuhrzoexumlterark.supabase.co/rest/v1/task_with_priority?completed=eq.false&priority=gte.1&order=priority.desc", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      "Content-Type": "application/json"
    }
  });
  return response.json();
}

function calculateRemainingTime(deadline: string) {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const remainingTime = deadlineDate.getTime() - now.getTime();
  return remainingTime > 0 ? `${Math.ceil(remainingTime / (1000 * 60 * 60))} hours` : "Time's up!";
}

async function sendDiscordNotification(message: string) {
  await fetch(DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: message
    })
  });
}

Deno.serve(async (req) => {
  if (req.method === "POST") {
    await notifyHighPriorityTasks();
    return new Response("Notifications sent", {
      status: 200
    });
  }
  return new Response("Method not allowed", {
    status: 405
  });
});
