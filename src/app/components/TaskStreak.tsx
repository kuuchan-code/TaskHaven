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
  const [weeklyStats, setWeeklyStats] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [maxCompletedInDay, setMaxCompletedInDay] = useState(0);
  const [achievementUnlocked, setAchievementUnlocked] = useState(false);

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
      
      // 実績解除のチェック
      if (streakCount >= 5 && todayStreak < 5) {
        setAchievementUnlocked(true);
        setTimeout(() => setAchievementUnlocked(false), 5000);
      }
    }

    // 過去7日間の統計を計算
    const weekStats = [];
    let maxDaily = 0;
    
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
      maxDaily = Math.max(maxDaily, dayCount);
    }
    
    setWeeklyStats(weekStats);
    setMaxCompletedInDay(maxDaily);
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
    if (count === 0) return 16; // 最小高さ

    // 安全な最大高さ（コンテナの高さ-マージン）
    const maxHeight = 115; // h-32 = 8rem = 128px、マージンを考慮
    
    // 比率を計算（最大値に対する割合）
    const maxCount = Math.max(...weeklyStats, 1);
    const ratio = count / maxCount;
    
    // 最小高さ16px + 残りの高さを比率で決定
    return Math.min(16 + ratio * (maxHeight - 16), maxHeight);
  };
  
  // 曜日の略称を取得
  const getDayLabel = (dayOffset: number) => {
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    const date = new Date();
    date.setDate(date.getDate() - (6 - dayOffset));
    return days[date.getDay()];
  };
  
  // 達成バッジを取得
  const getAchievementBadge = () => {
    if (maxCompletedInDay >= 10) return { name: "タスクマスター", icon: "🏆", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" };
    if (maxCompletedInDay >= 5) return { name: "プロダクティビティの達人", icon: "🌟", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" };
    if (maxCompletedInDay >= 3) return { name: "効率の賢者", icon: "🔥", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" };
    return { name: "タスクの冒険者", icon: "🌱", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" };
  };

  const feedback = getStreakFeedback();
  const badge = getAchievementBadge();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 animate-fadeIn">
      {/* 実績解除アニメーション */}
      {achievementUnlocked && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-6 rounded-lg shadow-xl
          z-50 animate-pulse-custom text-center">
          <div className="text-4xl mb-2">🎖️</div>
          <h3 className="text-xl font-bold mb-2">{t("achievementUnlocked")}</h3>
          <p>{t("completedFiveTasks")}</p>
        </div>
      )}
    
      <h2 className="text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-800 dark:text-gray-100">
        {t("streakTitle")}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        {/* 今日の達成数 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 
          p-4 sm:p-6 rounded-lg shadow-inner text-center">
          <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">{t("todayCompleted")}</h3>
          <div className={`text-6xl font-bold ${getStreakColor()} ${animate ? 'animate-bounce-custom' : ''}`}>
            {todayStreak}
          </div>
          <div className="mt-3 flex items-center justify-center text-lg">
            <span className="mr-2">{feedback.icon}</span>
            <span className="font-medium">{feedback.message}</span>
          </div>
        </div>
        
        {/* 週間チャート */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-900 dark:to-gray-800
          p-2 sm:p-4 md:p-6 rounded-lg shadow-inner overflow-hidden">
          <h3 className="text-lg font-semibold mb-2 sm:mb-4 text-gray-700 dark:text-gray-300 text-center">{t("weeklyProgress")}</h3>
          
          {/* バーチャート */}
          <div className="flex items-end justify-between h-32 px-0 sm:px-1 md:px-2 relative">
            {weeklyStats.map((count, index) => (
              <div key={index} className="flex flex-col items-center w-1/7 px-0.5">
                <div 
                  className={`w-3 sm:w-5 md:w-7 rounded-t-md ${count > 0 
                    ? 'bg-gradient-to-t from-blue-400 to-blue-600 dark:from-blue-600 dark:to-blue-400' 
                    : 'bg-gray-200 dark:bg-gray-700'}`}
                  style={{ 
                    height: `${getBarHeight(count)}px`,
                    minHeight: '16px',
                    transition: 'height 0.5s ease-out'
                  }}
                ></div>
                <div className="text-xs mt-1 font-medium text-gray-600 dark:text-gray-400">{getDayLabel(index)}</div>
                <div className="text-xs font-bold">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 達成バッジ */}
      <div className="mt-6 sm:mt-8 text-center">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">{t("yourAchievement")}</h3>
        <div className={`inline-block ${badge.color} px-4 py-2 rounded-full shadow-md animate-slideIn`}>
          <span className="mr-1">{badge.icon}</span>
          <span className="font-medium">{badge.name}</span>
        </div>
        
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {maxCompletedInDay === 0 
            ? t("noTasksYet") 
            : t("highestCompleted", { count: maxCompletedInDay })}
        </div>
      </div>
    </div>
  );
}
