// src/app/components/CalendarView.tsx
"use client";

import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD HH:mm" or null
};

interface CalendarViewProps {
  tasks: Task[];
};

// ユーティリティ：Date を "YYYY-MM-DD" 形式に変換
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 選択された日付に一致するタスクを抽出
  const tasksOnDate = (date: Date) => {
    const targetDateString = formatDate(date);
    return tasks.filter(task => {
      if (task.deadline) {
        // "YYYY-MM-DD HH:mm" の空白を "T" に置換して Date に変換
        const taskDate = new Date(task.deadline.replace(' ', 'T'));
        const taskDateString = formatDate(taskDate);
        return taskDateString === targetDateString;
      }
      return false;
    });
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4 text-center">カレンダーでタスクを確認</h2>
      <Calendar
        onChange={(date) => setSelectedDate(date as Date)}
        tileContent={({ date, view }) => {
          if (view === 'month') {
            const tasksForDate = tasksOnDate(date);
            return tasksForDate.length > 0 ? (
              <div className="flex justify-center items-center mt-1">
                {/* タスクの件数を小さいバッジとして表示 */}
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                  {tasksForDate.length}件
                </span>
              </div>
            ) : null;
          }
          return null;
        }}
        tileClassName={({ date, view }) => {
          // タスクがある日は背景色を変更して強調
          if (view === 'month') {
            const tasksForDate = tasksOnDate(date);
            return tasksForDate.length > 0 ? 'bg-red-50 hover:bg-red-100 rounded-full' : '';
          }
          return '';
        }}
        className="mx-auto"
      />
      {selectedDate && (
        <div className="mt-6 p-4 bg-white shadow rounded max-w-md mx-auto">
          <h3 className="text-xl font-medium mb-3 border-b pb-2">
            {selectedDate.toLocaleDateString()} のタスク
          </h3>
          {tasksOnDate(selectedDate).length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {tasksOnDate(selectedDate).map((task, index) => (
                <li key={index}>
                  <span className="font-medium">{task.title}</span>
                  <span className="text-sm text-gray-600 ml-1">(重要度: {task.importance})</span>
                  {task.deadline && (
                    <span className="text-xs text-gray-500 ml-1">期限: {task.deadline}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 text-center">この日にタスクはありません。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
