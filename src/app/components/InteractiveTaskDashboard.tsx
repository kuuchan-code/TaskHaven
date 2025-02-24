// src/app/components/InteractiveTaskDashboard.tsx
"use client";

import React, { useState } from "react";
import CalendarWrapper from "./CalendarWrapper";
import { Task } from "../page";

// 日付を "YYYY-MM-DD" に変換するユーティリティ
const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

interface InteractiveTaskDashboardProps {
    tasks: Task[];
    tasksWithDeadline: (Task & { priority: number; remainingHours: number })[];
    tasksWithoutDeadline: Task[];
}

const InteractiveTaskDashboard: React.FC<InteractiveTaskDashboardProps> = ({
    tasks,
    tasksWithDeadline,
    tasksWithoutDeadline,
}) => {
    // 日付の選択状態を管理（カレンダーとタスク一覧で共有）
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // 選択された日付と一致する期限付きタスクを抽出（優先度付き）
    const tasksForSelectedDate = selectedDate
        ? tasksWithDeadline.filter((task) => {
            const taskDate = new Date(task.deadline!.replace(" ", "T"));
            return formatDate(taskDate) === formatDate(selectedDate);
        })
        : [];

    // 期限付きタスク一覧でタスクがクリックされた場合、対応する日付を選択
    const handleTaskClick = (deadline: string) => {
        const date = new Date(deadline.replace(" ", "T"));
        setSelectedDate(date);
    };

    return (
        <div>
            {/* 期限なしタスクはそのまま表示 */}
            <section className="mb-12">
                <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                    期限なしタスク (重要度順)
                </h2>
                {tasksWithoutDeadline.length > 0 ? (
                    <ul className="space-y-4">
                        {tasksWithoutDeadline.map((task) => (
                            <li
                                key={task.title}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                                        {task.title}
                                    </span>
                                    <span className="text-base text-gray-600 dark:text-gray-300">
                                        重要度: {task.importance}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                        期限なしタスクはありません。
                    </p>
                )}
            </section>

            {/* 期限付きタスク一覧（クリックでカレンダーと連動） */}
            <section className="mb-12">
                <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                    期限付きタスク (優先度順)
                </h2>
                {tasksWithDeadline.length > 0 ? (
                    <ul className="space-y-4">
                        {tasksWithDeadline.map((task) => {
                            // 優先度の閾値。実際のデータに合わせて調整してください。
                            const HIGH_PRIORITY_THRESHOLD = 5;
                            const isHighPriority = task.priority >= HIGH_PRIORITY_THRESHOLD;
                            return (
                                <li
                                    key={task.title}
                                    onClick={() =>
                                        task.deadline ? handleTaskClick(task.deadline) : null
                                    }
                                    className={`cursor-pointer bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 ${selectedDate &&
                                            task.deadline &&
                                            formatDate(new Date(task.deadline.replace(" ", "T"))) ===
                                            formatDate(selectedDate)
                                            ? "ring-2 ring-blue-500"
                                            : ""
                                        } ${isHighPriority ? "ring-4 ring-red-500" : ""}`}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between items-center">
                                        <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                                            {task.title}
                                        </span>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-base text-gray-600 dark:text-gray-300">
                                                優先度: {task.priority.toFixed(2)}
                                            </span>
                                            {isHighPriority && (
                                                <>
                                                    <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                                                        高優先度
                                                    </span>
                                                    <span className="text-base text-gray-600 dark:text-gray-300">
                                                        残り: {task.remainingHours.toFixed(1)}時間
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                        期限付きタスクはありません。
                    </p>
                )}

            </section>

            {/* カレンダー表示（カレンダー側で日付選択すると state を更新） */}
            <section className="mb-12">
                <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                    カレンダー表示
                </h2>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <CalendarWrapper
                        tasks={tasks.filter((task) => task.deadline !== null)}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                    />
                </div>
            </section>

            {/* 選択された日のタスクを一覧表示（ヘッダーに日付を追加、優先度のみ表示） */}
            <section className="mb-12">
                <h2 className="text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-300 dark:border-gray-700 pb-2">
                    {selectedDate
                        ? `選択された日のタスク (${formatDate(selectedDate)})`
                        : "選択された日のタスク"}
                </h2>
                {selectedDate ? (
                    tasksForSelectedDate.length > 0 ? (
                        <ul className="space-y-4">
                            {tasksForSelectedDate.map((task) => (
                                <li
                                    key={task.title}
                                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                                            {task.title}
                                        </span>
                                        <span className="text-base text-gray-600 dark:text-gray-300">
                                            優先度: {task.priority.toFixed(2)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600 dark:text-gray-300">
                            この日にタスクはありません。
                        </p>
                    )
                ) : (
                    <p className="text-gray-600 dark:text-gray-300">
                        カレンダーまたはタスクをクリックして日付を選択してください。
                    </p>
                )}
            </section>
        </div>
    );
};

export default InteractiveTaskDashboard;
