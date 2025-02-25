// src/app/components/CalendarWrapper.tsx
"use client";
import React from "react";
import CalendarView from "./CalendarView";
import { Task } from "../page";

interface CalendarWrapperProps {
  tasks: Task[];
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
}

const CalendarWrapper: React.FC<CalendarWrapperProps> = ({ tasks, selectedDate, setSelectedDate }) => {
  return <CalendarView tasks={tasks} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />;
};

export default CalendarWrapper;
