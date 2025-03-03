"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Task } from "../types/taskTypes"; // 共通の型定義をインポート

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
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const today = new Date();
    const streakCount = tasks.filter((task) => {
      if (task.completed && task.completed_at) {
        const taskDate = new Date(task.completed_at);
        return isSameDay(today, taskDate);
      }
      return false;
    }).length;
    
    // 値が変わった時にアニメーションをトリガー
    if (todayStreak !== streakCount) {
      setTodayStreak(streakCount);
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000);
    }
  }, [tasks, todayStreak]);

  // 達成度に応じた色を返す
  const getStreakColor = () => {
    if (todayStreak >= 5) return "text-emerald-600 dark:text-emerald-400";
    if (todayStreak >= 3) return "text-blue-600 dark:text-blue-400";
    return "text-blue-800 dark:text-blue-200";
  };

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg shadow-md text-center mb-6 transition-all duration-300 hover:shadow-lg">
      <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-2">
        {t("todayStreak", { defaultValue: "今日のタスク達成数" })}
      </h2>
      <div className="flex items-center justify-center">
        <span className={`text-4xl font-bold ${getStreakColor()} ${animate ? 'scale-125 transition-transform duration-300' : 'transition-transform duration-300'}`}>
          {todayStreak}
        </span>
        <span className="text-blue-600 dark:text-blue-400 ml-2 text-lg">/ {tasks.length || 0}</span>
      </div>
      {todayStreak > 0 && (
        <div className="mt-2 text-sm text-blue-600 dark:text-blue-300">
          {todayStreak >= 5 ? t("excellent") : todayStreak >= 3 ? t("goodJob") : t("keepGoing")}
        </div>
      )}
    </div>
  );
}
