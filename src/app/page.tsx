"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { buttonClasses, sectionHeaderClasses } from "./utils/designUtils";
import { SignUpForm } from "./components/auth/SignUpForm";
import { LoginForm } from "./components/auth/LoginForm";
import { PasswordResetModal } from "./components/auth/PasswordResetModal";
import Header from "./components/Header";

export default function HomePage() {
  const t = useTranslations("HomePage");
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-bold mb-2 text-gray-800">TaskHaven</h1>
            <p className="text-lg text-gray-600">{t("slogan")}</p>
          </header>
          
          <div className="max-w-md mx-auto">
            <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
              <button 
                className={`flex-1 py-2 rounded-md transition-all ${activeTab === 'login' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setActiveTab('login')}
              >
                {t("login")}
              </button>
              <button 
                className={`flex-1 py-2 rounded-md transition-all ${activeTab === 'signup' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
                onClick={() => setActiveTab('signup')}
              >
                {t("signup")}
              </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
              {activeTab === 'login' ? <LoginForm /> : <SignUpForm />}
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
    </div>
  );
}
