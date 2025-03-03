"use client";

import { useTranslations } from "next-intl";
import { sectionHeaderClasses } from "./utils/designUtils";
import { SignUpForm } from "./components/auth/SignUpForm";
import { LoginForm } from "./components/auth/LoginForm";
import { PasswordResetModal } from "./components/auth/PasswordResetModal";

export default function HomePage() {
  const t = useTranslations("HomePage");
  
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-800">TaskHaven</h1>
          <p className="text-lg text-gray-600">{t("slogan")}</p>
        </header>
        
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
          <div className="w-full md:w-1/2">
            <SignUpForm />
          </div>
          
          <div className="w-full md:w-1/2">
            <LoginForm />
          </div>
        </div>
        
        <div className="mt-12 max-w-3xl mx-auto">
          <h2 className={sectionHeaderClasses}>{t("features")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{t("featureTaskTitle")}</h3>
              <p className="text-gray-600">{t("featureTaskDesc")}</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{t("featureCollabTitle")}</h3>
              <p className="text-gray-600">{t("featureCollabDesc")}</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-semibold mb-2">{t("featureProgressTitle")}</h3>
              <p className="text-gray-600">{t("featureProgressDesc")}</p>
            </div>
          </div>
        </div>
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} TaskHaven. {t("allRightsReserved")}</p>
        </footer>
      </div>
      
      <PasswordResetModal />
    </main>
  );
}
