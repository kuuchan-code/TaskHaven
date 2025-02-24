// src/app/components/CalendarWrapper.tsx
"use client";

import dynamic from 'next/dynamic';
import { Task } from '../page';

const CalendarView = dynamic(() => import('./CalendarView'), { ssr: false });

interface CalendarWrapperProps {
  tasks: Task[];
}

export default function CalendarWrapper({ tasks }: CalendarWrapperProps) {
  return <CalendarView tasks={tasks} />;
}
