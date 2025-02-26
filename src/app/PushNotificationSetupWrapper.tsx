// src/app/PushNotificationSetupWrapper.tsx
"use client";
import dynamic from "next/dynamic";

// ssr: false をここで設定
const PushNotificationSetup = dynamic(
  () => import("./components/PushNotificationSetup"),
  { ssr: false }
);

export default function PushNotificationSetupWrapper() {
  return <PushNotificationSetup />;
}
