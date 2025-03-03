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
  const [weeklyStats, setWeeklyStats] = useState<number[]>([]);

  useEffect(() => {
    // 今日の達成タスク数を計算
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

    // デバッグ用：タスクの数と状態をログに出力
    console.log('TaskStreak: タスクの総数', tasks.length);
    console.log('TaskStreak: 完了済みタスク数', tasks.filter(task => task.completed).length);
    console.log('TaskStreak: completed_at が設定されているタスク数', tasks.filter(task => task.completed_at).length);

    // 過去7日間の統計を計算
    const weekStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayCount = tasks.filter((task) => {
        if (task.completed && task.completed_at) {
          const taskDate = new Date(task.completed_at);
          return isSameDay(date, taskDate);
        }
        return false;
      }).length;
      
      weekStats.push(dayCount);
    }
    setWeeklyStats(weekStats);
    
    // デバッグ用：週間統計のログ出力
    console.log('TaskStreak: 週間統計', weekStats);
  }, [tasks, todayStreak]);

  // 達成度に応じた色を返す
  const getStreakColor = () => {
    if (todayStreak >= 5) return "text-emerald-600 dark:text-emerald-400";
    if (todayStreak >= 3) return "text-blue-600 dark:text-blue-400";
    return "text-blue-800 dark:text-blue-200";
  };

  // 達成度に応じたメッセージとアイコンを返す
  const getStreakFeedback = () => {
    if (todayStreak >= 5) {
      return {
        message: t("excellent"),
        icon: "🎉"
      };
    } 
    if (todayStreak >= 3) {
      return {
        message: t("goodJob"),
        icon: "👍"
      };
    }
    return {
      message: t("keepGoing"),
      icon: "💪"
    };
  };

  // 週間グラフの各バーの高さを計算
  const getBarHeight = (count: number) => {
    // 最大値を0より大きくするため、weeklyStatsの最大値と1の大きい方を使用
    const maxCount = Math.max(...weeklyStats, 1);
    // 最低10%の高さを確保し、countに基づいてパーセンテージを計算
    return count > 0 ? Math.max((count / maxCount) * 100, 10) : 10; // 0の場合でも最低10%の高さを確保
  };

  // 曜日の配列（日曜始まり）
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const today = new Date();
  const dayIndex = today.getDay(); // 0=日曜, 1=月曜, ...

  const feedback = getStreakFeedback();

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl shadow-md text-center transition-all duration-300 hover:shadow-lg">
      <h2 className="text-xl font-bold text-blue-700 dark:text-blue-300 mb-3">
        {t("todayStreak", { defaultValue: "今日のタスク達成数" })}
      </h2>
      
      <div className="flex items-center justify-center mb-3">
        <span 
          className={`text-5xl font-bold ${getStreakColor()} 
          ${animate ? 'scale-125 transition-transform duration-300' : 'transition-transform duration-300'}`}
        >
          {todayStreak}
        </span>
        <span className="text-blue-600 dark:text-blue-400 ml-2 text-lg">/ {tasks.filter(t => !t.completed).length + todayStreak || 0}</span>
      </div>
      
      {todayStreak > 0 && (
        <div className="mb-3 text-lg font-medium text-blue-600 dark:text-blue-300 flex items-center justify-center">
          <span className="text-2xl mr-2">{feedback.icon}</span>
          {feedback.message}
        </div>
      )}

      <div className="mt-3">
        <h3 className="text-md font-semibold text-blue-700 dark:text-blue-300 mb-1">
          {t("weeklyProgress", { defaultValue: "週間の進捗" })}
        </h3>
        {weeklyStats.length > 0 ? (
          <div className="flex justify-between items-end h-28 px-1">
            {weeklyStats.map((count, index) => {
              const isToday = index === 6;
              const dayOfWeek = weekdays[(dayIndex + index - 6 + 7) % 7];
              
              return (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className={`w-11 transition-all duration-500 ease-out 
                      ${isToday 
                        ? 'bg-blue-500 dark:bg-blue-400' 
                        : 'bg-blue-300 dark:bg-blue-700'
                      } rounded-t-md`}
                    style={{ height: `${getBarHeight(count)}%` }}
                  >
                  </div>
                  <div className={`text-sm font-medium ${isToday ? 'text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                    {dayOfWeek}
                  </div>
                  <div className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-gray-500 dark:text-gray-400">
            {t("noDataAvailable", { defaultValue: "データがありません" })}
          </div>
        )}
      </div>
    </div>
  );
}
