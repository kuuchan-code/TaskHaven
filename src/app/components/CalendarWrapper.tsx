// src/app/components/CalendarWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import { Task } from "../page";

interface CalendarWrapperProps {
  tasks: Task[];
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

const CalendarView = dynamic(
  () => import("./CalendarView"),
  { ssr: false }
);

export default function CalendarWrapper({ tasks, selectedDate, setSelectedDate }: CalendarWrapperProps) {
  return (
    <CalendarView
      tasks={tasks}
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
    />
  );
}
