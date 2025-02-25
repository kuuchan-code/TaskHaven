// src/app/components/CalendarView.tsx
"use client";

import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { usePrefersColorSchemeDark } from "@wojtekmaj/react-hooks";

export type Task = {
  id?: number;
  title: string;
  importance: number;
  deadline: string | null;
};

interface CalendarViewProps {
  tasks: Task[];
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  selectedDate,
  setSelectedDate,
}) => {
  const prefersColorSchemeDark = usePrefersColorSchemeDark();

  const tasksOnDate = (date: Date) => {
    const targetDateString = formatDate(date);
    return tasks.filter((task) => {
      if (task.deadline) {
        const taskDate = new Date(task.deadline);
        const taskDateString = formatDate(taskDate);
        return taskDateString === targetDateString;
      }
      return false;
    });
  };

  return (
    <div className="mt-4">
      <Calendar
        onChange={(date) => setSelectedDate(date as Date)}
        value={selectedDate}
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
        className={`react-calendar mx-auto ${prefersColorSchemeDark ? "dark" : ""}`}
      />
    </div>
  );
};

export default CalendarView;
