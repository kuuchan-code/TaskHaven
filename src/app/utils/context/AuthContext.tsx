"use client";

import { createContext, useContext, ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";

// Auth Contextの型定義
type AuthContextType = ReturnType<typeof useAuth>;

// デフォルト値
const defaultAuthContext: AuthContextType = {
  signUpUsername: "",
  setSignUpUsername: () => {},
  signUpEmail: "",
  setSignUpEmail: () => {},
  signUpPassword: "",
  setSignUpPassword: () => {},
  loginEmail: "",
  setLoginEmail: () => {},
  loginPassword: "",
  setLoginPassword: () => {},
  isSigningUp: false,
  isLoggingIn: false,
  signupComplete: false,
  showPassword: false,
  setShowPassword: () => {},
  showLoginPassword: false,
  setShowLoginPassword: () => {},
  rememberMe: false,
  setRememberMe: () => {},
  showResetModal: false,
  setShowResetModal: () => {},
  resetEmail: "",
  setResetEmail: () => {},
  isResetting: false,
  resetMessage: null,
  error: null,
  setError: () => {},
  message: null,
  setMessage: () => {},
  fieldErrors: {},
  setFieldErrors: () => {},
  handleSignUp: async () => {},
  handleLogin: async () => {},
  handleResetPassword: async () => {},
  checkIfExists: async () => ({ exists: false, error: null }),
};

// AuthContextを作成
const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// AuthProviderコンポーネント
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuthContext = () => useContext(AuthContext); 