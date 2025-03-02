"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Task = {
  completed: boolean;
  completed_at?: string; // 完了日時（ISO文字列）
};

type TaskStreakProps = {
  tasks: Task[];
};

// 年・月・日が同じかどうかを判定するヘルパー関数
const isSameDay = (date1: Date, date2: Date): boolean =>
  date1.getFullYear() === date2.getFullYear() &&
  date1.getMonth() === date2.getMonth() &&
  date1.getDate() === date2.getDate();

export default function TaskStreak({ tasks }: TaskStreakProps) {
  const t = useTranslations("TaskStreak");
  const [todayStreak, setTodayStreak] = useState(0);

  useEffect(() => {
    const today = new Date();
    const streakCount = tasks.filter((task) => {
      if (task.completed && task.completed_at) {
        const taskDate = new Date(task.completed_at);
        return isSameDay(today, taskDate);
      }
      return false;
    }).length;
    setTodayStreak(streakCount);
  }, [tasks]);

  return (
    <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg shadow-md text-center mb-6">
      <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300">
        {t("todayStreak", { defaultValue: "今日のタスク達成数" })}
      </h2>
      <p className="text-2xl text-blue-800 dark:text-blue-200">{todayStreak}</p>
    </div>
  );
}
