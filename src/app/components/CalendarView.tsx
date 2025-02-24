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
}

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
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">カレンダーで確認</h2>
      <Calendar
        onChange={(date) => setSelectedDate(date as Date)}
        tileContent={({ date, view }) => {
          if (view === 'month') {
            const tasksForDate = tasksOnDate(date);
            return tasksForDate.length > 0 ? (
              <div className="text-xs text-red-500 mt-1">
                {tasksForDate.length}件
              </div>
            ) : null;
          }
          return null;
        }}
        className="mx-auto"
      />
      {selectedDate && (
        <div className="mt-4 p-4 bg-white shadow rounded">
          <h3 className="text-xl font-medium mb-2">
            {selectedDate.toLocaleDateString()} のタスク
          </h3>
          {tasksOnDate(selectedDate).length > 0 ? (
            <ul className="list-disc pl-5">
              {tasksOnDate(selectedDate).map((task, index) => (
                <li key={index} className="mb-1">
                  <span className="font-medium">{task.title}</span> (重要度: {task.importance}, 期限: {task.deadline})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">この日にタスクはありません。</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarView;
