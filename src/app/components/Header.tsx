"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import LogoutButton from "./LogoutButton";
import { useState } from "react";

type HeaderProps = {
  username?: string;
  isHomePage?: boolean;
};

export default function Header({ username, isHomePage = false }: HeaderProps) {
  const t = useTranslations("Header");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ユーザー名があるか、ホームページでない場合にメニューを表示する
  const shouldShowMenu = username || !isHomePage;

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={username ? `/${username}` : "/"} className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Task Haven</span>
            </Link>
          </div>

          {/* デスクトップメニュー */}
          <div className="hidden md:flex items-center space-x-4">
            {username && (
              <>
                <span className="text-blue-300">
                  {t("welcomeMessage", { username })}
                </span>
                <LogoutButton />
              </>
            )}
            {!username && !isHomePage && (
              <Link href="/" className="hover:text-blue-200">
                {t("login")}
              </Link>
            )}
          </div>

          {/* モバイルメニューボタン - 表示するものがある場合のみ表示 */}
          {shouldShowMenu && (
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">{t("openMenu")}</span>
                {/* ハンバーガーアイコン */}
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* モバイルメニュー - メニューが開かれていて、表示するコンテンツがある場合のみ表示 */}
      {isMenuOpen && shouldShowMenu && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {username && (
              <>
                <span className="block px-3 py-2 text-blue-300">
                  {t("welcomeMessage", { username })}
                </span>
                <div className="px-3 py-2">
                  <LogoutButton />
                </div>
              </>
            )}
            {!username && !isHomePage && (
              <Link 
                href="/" 
                className="block px-3 py-2 rounded-md text-white hover:bg-blue-700"
              >
                {t("login")}
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 