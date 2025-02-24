// src/app/components/CalendarView.tsx
"use client";

import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { usePrefersColorSchemeDark } from "@wojtekmaj/react-hooks";

export type Task = {
  title: string;
  importance: number;
  deadline: string | null; // "YYYY-MM-DD HH:mm" or null
};

interface CalendarViewProps {
  tasks: Task[];
}

// Date を "YYYY-MM-DD" 形式に変換するユーティリティ
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const prefersColorSchemeDark = usePrefersColorSchemeDark();

  // 指定日付と一致するタスクを抽出
  const tasksOnDate = (date: Date) => {
    const targetDateString = formatDate(date);
    return tasks.filter((task) => {
      if (task.deadline) {
        const taskDate = new Date(task.deadline.replace(" ", "T"));
        const taskDateString = formatDate(taskDate);
        return taskDateString === targetDateString;
      }
      return false;
    });
  };

  return (
    <div className="mt-10 px-4">
      <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
        カレンダーでタスクを確認
      </h2>
      <div
        className={`max-w-md mx-auto rounded-lg  p-4 ${
          prefersColorSchemeDark ? "bg-gray-800" : "bg-white"
        }`}
      >
        <Calendar
          onChange={(date) => setSelectedDate(date as Date)}
          tileContent={({ date, view }) => {
            if (view === "month") {
              const tasksForDate = tasksOnDate(date);
              return tasksForDate.length > 0 ? (
                <div className="flex justify-center items-center mt-1">
                  <span
                    className={`text-white text-xs font-semibold rounded-full px-2 py-0.5 shadow-md ${
                      prefersColorSchemeDark ? "bg-blue-400" : "bg-blue-600"
                    }`}
                  >
                    {tasksForDate.length}件
                  </span>
                </div>
              ) : null;
            }
            return null;
          }}
          tileClassName={({ date, view }) => {
            if (view === "month") {
              const tasksForDate = tasksOnDate(date);
              return tasksForDate.length > 0
                ? prefersColorSchemeDark
                  ? "bg-blue-900 hover:bg-blue-700 rounded-full transition-colors duration-200"
                  : "bg-blue-50 hover:bg-blue-100 rounded-full transition-colors duration-200"
                : "";
            }
            return "";
          }}
          className={`react-calendar mx-auto ${
            prefersColorSchemeDark ? "dark" : ""
          }`}
        />
      </div>
      {selectedDate && (
        <div
          className={`mt-8 max-w-md mx-auto rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-105 ${
            prefersColorSchemeDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div
            className={`p-6 border-b ${
              prefersColorSchemeDark
                ? "border-gray-700 text-gray-100"
                : "border-gray-300 text-gray-900"
            }`}
          >
            <h3 className="text-2xl font-semibold mb-3">
              {selectedDate.toLocaleDateString()} のタスク
            </h3>
          </div>
          <div className="p-6">
            {tasksOnDate(selectedDate).length > 0 ? (
              <ul className="space-y-4">
                {tasksOnDate(selectedDate).map((task, index) => (
                  <li
                    key={index}
                    className={`p-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                      prefersColorSchemeDark ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                      <span
                        className={`text-lg font-medium ${
                          prefersColorSchemeDark ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </span>
                      <div
                        className={`mt-2 sm:mt-0 text-sm space-x-2 ${
                          prefersColorSchemeDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        <span>重要度: {task.importance}</span>
                        {task.deadline && (
                          <>
                            <span>|</span>
                            <span>期限: {task.deadline}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p
                className={`text-center ${
                  prefersColorSchemeDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                この日にタスクはありません。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
