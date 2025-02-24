// src/app/components/CalendarWrapper.tsx
"use client";

import dynamic from 'next/dynamic';
import { Task } from '../page'; // 型定義を共通化する場合。適宜パス調整してください。

// クライアント側でのみレンダリングするためssr: falseを指定
const CalendarView = dynamic(() => import('./CalendarView'), { ssr: false });

interface CalendarWrapperProps {
  tasks: Task[];
}

export default function CalendarWrapper({ tasks }: CalendarWrapperProps) {
  return <CalendarView tasks={tasks} />;
}
