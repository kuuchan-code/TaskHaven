// src/app/sendNotification.js
import fetch from "node-fetch";

export async function sendNotification(task) {
  // task は { fcmToken, title, priority } などのプロパティを持つと仮定
  const response = await fetch("https://my-tasks-worker.kuuchanxn.workers.dev /", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fcmToken: task.fcmToken,
      title: task.title,
      priority: task.priority,
    }),
  });
  console.log(await response.text());
}
