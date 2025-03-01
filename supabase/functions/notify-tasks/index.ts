import "jsr:@supabase/functions-js/edge-runtime.d.ts";

async function notifyHighPriorityTasks() {
  const tasks = await fetchTasksWithHighPriority();
  if (!Array.isArray(tasks)) {
    console.error("Unexpected response format", tasks);
    return;
  }
  
  // ユーザーごとにタスクをグループ化
  const tasksByUser = new Map<string, any[]>();
  for (const task of tasks) {
    const username = task.username;
    if (!username) {
      console.error("No username in task", task);
      continue;
    }
    if (!tasksByUser.has(username)) {
      tasksByUser.set(username, []);
    }
    tasksByUser.get(username)!.push(task);
  }
  
  // 各ユーザーについて通知実行の条件を確認
  for (const [username, userTasks] of tasksByUser.entries()) {
    // ユーザーの設定を取得（notification_interval と last_notification）
    const { notification_interval, last_notification, webhook_url } = await fetchUserSettings(username);
    if (!webhook_url) {
      console.error(`No webhook URL for user ${username}`);
      continue;
    }
    
    const now = new Date();
    const lastNotificationTime = last_notification ? new Date(last_notification) : null;
    
    // last_notification が存在しない、または経過時間が設定値以上の場合のみ通知を送信
    if (!lastNotificationTime || (now.getTime() - lastNotificationTime.getTime()) >= notification_interval * 60 * 1000) {
      let message = `Tasks for ${username}:\n`;
      for (const task of userTasks) {
        const remainingTime = calculateRemainingTime(task.deadline);
        message += `Task: ${task.title} | Priority: ${task.priority} | Remaining: ${remainingTime}\n`;
      }
      await sendDiscordNotification(webhook_url, message);
      
      // 通知送信後、last_notification を更新する
      await updateLastNotification(username, now.toISOString());
    } else {
      console.log(`Skipping notification for ${username} (interval not reached)`);
    }
  }
}

// ユーザー設定を取得する関数の例
async function fetchUserSettings(username: string) {
  const response = await fetch(`https://<YOUR_SUPABASE_URL>/rest/v1/users?username=eq.${username}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      "Content-Type": "application/json"
    }
  });
  const data = await response.json();
  return data[0] || {};
}

// 通知送信後に最終通知時刻を更新する関数の例
async function updateLastNotification(username: string, timestamp: string) {
  await fetch(`https://<YOUR_SUPABASE_URL>/rest/v1/users`, {
    method: "PATCH", // または upsert を利用
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ last_notification: timestamp }),
    // onConflict 等のオプションを必要に応じて設定
  });
}

async function fetchTasksWithHighPriority() {
  // conditions: completed が false, priority が 1 以上,
  // 並び順: username 昇順, priority 降順
  const response = await fetch("https://gmzfuhrzoexumlterark.supabase.co/rest/v1/task_with_priority?completed=eq.false&priority=gte.1&order=username.asc,priority.desc", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      "Content-Type": "application/json"
    }
  });
  return response.json();
}

async function fetchWebhookUrl(username: string) {
  // users テーブルから該当 username のレコードを取得し、webhook_url を返す
  const response = await fetch(`https://gmzfuhrzoexumlterark.supabase.co/rest/v1/users?username=eq.${username}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      "apikey": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      "Content-Type": "application/json"
    }
  });
  const data = await response.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0].webhook_url;
  }
  return null;
}

function calculateRemainingTime(deadline: string) {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  const remainingTime = deadlineDate.getTime() - now.getTime();
  return remainingTime > 0 ? `${Math.ceil(remainingTime / (1000 * 60 * 60))} hours` : "Time's up!";
}

async function sendDiscordNotification(webhookUrl: string, message: string) {
  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ content: message })
  });
}

Deno.serve(async (req) => {
  if (req.method === "POST") {
    await notifyHighPriorityTasks();
    return new Response("Notifications sent", { status: 200 });
  }
  return new Response("Method not allowed", { status: 405 });
});

