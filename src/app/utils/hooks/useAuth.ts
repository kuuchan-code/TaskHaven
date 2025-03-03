import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../supabase/client";

interface AuthError {
  message: string;
  [key: string]: unknown;
}

export type FieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  loginEmail?: string;
  loginPassword?: string;
  resetEmail?: string;
};

/**
 * 認証関連のカスタムフック
 */
export const useAuth = () => {
  const router = useRouter();
  const supabase = createClient();

  // サインアップ状態
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  
  // ログイン状態
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // パスワードリセット状態
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  
  // UI状態
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // エラーとメッセージ
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  /**
   * ユーザー名またはメールが既に存在するかチェック
   */
  const checkIfExists = async (field: "username" | "email", value: string) => {
    const searchValue = field === "email" ? value.toLowerCase() : value;
    
    const { data, error } = await supabase
      .from("users")
      .select(field)
      .ilike(field, searchValue)
      .maybeSingle();
    
    return { exists: !!data, error };
  };

  /**
   * サインアップ処理
   */
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSigningUp(true);
    
    // 基本検証
    if (!signUpUsername || !signUpEmail || !signUpPassword) {
      setError("すべての項目を入力してください");
      setIsSigningUp(false);
      return;
    }
    
    try {
      console.log("サインアップ処理開始");
      
      // メールアドレスとユーザー名がすでに使用されているかチェック
      const { exists: emailExists } = await checkIfExists("email", signUpEmail);
      if (emailExists) {
        setFieldErrors({ ...fieldErrors, email: "このメールアドレスは既に使用されています" });
        setIsSigningUp(false);
        return;
      }

      const { exists: usernameExists } = await checkIfExists("username", signUpUsername);
      if (usernameExists) {
        setFieldErrors({ ...fieldErrors, username: "このユーザー名は既に使用されています" });
        setIsSigningUp(false);
        return;
      }

      // サインアップ処理
      console.log("認証サインアップ処理開始");
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            username: signUpUsername,
          },
        },
      });

      if (signUpError) {
        console.error("サインアップエラー:", signUpError);
        throw signUpError;
      }
      
      console.log("認証サインアップ完了:", data.user?.id);

      // ユーザーテーブルにレコードを作成 (サーバーサイドAPIを使用)
      if (data?.user) {
        console.log("usersテーブルにデータ作成:", data.user.id);
        
        try {
          // サーバーサイドAPIを呼び出してユーザーデータを作成
          const response = await fetch('/api/user/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.user.id,
              username: signUpUsername,
              email: signUpEmail.toLowerCase(),
              created_at: new Date().toISOString(),
            }),
          });
          
          const result = await response.json();
          
          if (!response.ok) {
            console.error("API呼び出しエラー:", result);
            
            // 409 Conflict (重複エラー) を特別に処理
            if (response.status === 409) {
              if (result.duplicateField === "username") {
                setFieldErrors({ ...fieldErrors, username: "このユーザー名は既に使用されています" });
              } else if (result.duplicateField === "email") {
                setFieldErrors({ ...fieldErrors, email: "このメールアドレスは既に使用されています" });
              } else if (result.duplicateFields) {
                // 複数フィールドが重複している場合
                const newErrors: FieldErrors = {};
                if (result.duplicateFields.includes("username")) {
                  newErrors.username = "このユーザー名は既に使用されています";
                }
                if (result.duplicateFields.includes("email")) {
                  newErrors.email = "このメールアドレスは既に使用されています";
                }
                setFieldErrors({ ...fieldErrors, ...newErrors });
              }
              
              // 認証ユーザーを削除（プロフィール作成に失敗したため）
              try {
                const { error: cleanupError } = await supabase.auth.admin.deleteUser(data.user.id);
                if (cleanupError) {
                  console.error("ユーザークリーンアップエラー:", cleanupError);
                }
              } catch (cleanupErr) {
                console.error("クリーンアップ中のエラー:", cleanupErr);
              }
              
              throw new Error(result.message || "ユーザー情報が既に使用されています");
            }
            
            throw new Error(result.message || "ユーザープロフィールの作成に失敗しました");
          }
          
          console.log("ユーザープロフィール作成完了:", result);
        } catch (apiError: unknown) {
          console.error("APIエラー:", apiError as AuthError);
          
          // ユーザーは作成されたがプロフィールが作成できなかった場合の対応
          try {
            const { error: cleanupError } = await supabase.auth.admin.deleteUser(data.user.id);
            if (cleanupError) {
              console.error("ユーザークリーンアップエラー:", cleanupError);
            }
          } catch (cleanupErr) {
            console.error("クリーンアップ中のエラー:", cleanupErr);
          }
          
          throw apiError;
        }
      }

      // サインアップ成功
      setMessage("アカウントが作成されました。メールを確認して、登録を完了してください。");
      setSignupComplete(true);
      
    } catch (err: unknown) {
      const error = err as AuthError;
      console.error("サインアップエラー:", error);
      setError(error.message || "サインアップ中にエラーが発生しました");
    } finally {
      setIsSigningUp(false);
    }
  };

  /**
   * ログイン処理
   */
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoggingIn(true);
    
    // 基本検証
    if (!loginEmail || !loginPassword) {
      setError("メールアドレスとパスワードを入力してください");
      setIsLoggingIn(false);
      return;
    }
    
    try {
      console.log("ログイン試行中...");
      
      // ログイン処理を実行
      try {
        // 基本的なチェック
        if (!supabase) {
          console.error("Supabaseクライアントが初期化されていません");
          setError("認証システムとの接続に問題があります。しばらく経ってから再度お試しください。");
          setIsLoggingIn(false);
          return;
        }
        
        // ログイン処理
        let signInResult;
        try {
          signInResult = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: loginPassword,
          });
        } catch (signInErr) {
          console.error("サインインリクエスト失敗:", signInErr);
          setError("ログインリクエストに失敗しました。ネットワーク接続を確認してください。");
          setIsLoggingIn(false);
          return;
        }

        // エラーチェック
        if (signInResult.error) {
          console.error("ログインエラー:", signInResult.error);
          
          // エラーメッセージを日本語化
          const errorMessage = signInResult.error.message || "";
          if (typeof errorMessage === 'string') {
            if (errorMessage.includes("Invalid login credentials")) {
              setError("メールアドレスまたはパスワードが正しくありません");
            } else {
              setError(`ログインエラー: ${errorMessage}`);
            }
          } else {
            setError("ログイン処理中に不明なエラーが発生しました");
          }
          
          setIsLoggingIn(false);
          return;
        }

        console.log("ログイン成功");

        // ログイン成功時の処理
        if (rememberMe) {
          localStorage.setItem("loginEmail", loginEmail);
        } else {
          localStorage.removeItem("loginEmail");
        }
        
        // ユーザー情報取得
        let userResult;
        try {
          userResult = await supabase.auth.getUser();
        } catch (getUserErr) {
          console.error("ユーザー情報取得失敗:", getUserErr);
          setError("ユーザー情報の取得に失敗しました");
          setIsLoggingIn(false);
          return;
        }
        
        // ユーザー存在確認
        if (!userResult?.data?.user?.id) {
          console.error("ユーザー情報が不完全です");
          setError("ユーザー情報の取得に失敗しました");
          setIsLoggingIn(false);
          return;
        }
        
        const userId = userResult.data.user.id;
        
        // ユーザー情報取得後の処理
        console.log("ログイン成功、ユーザー情報取得完了");
        
        // ユーザー名の取得方法を修正
        // 1. まずauthユーザーからユーザー名を取得を試みる
        const authUsername = userResult.data.user.user_metadata?.username;
        
        if (authUsername) {
          console.log("認証メタデータからユーザー名取得:", authUsername);
          router.push(`/${authUsername}`);
          return;
        }
        
        // 2. なければusersテーブルから取得を試みる
        try {
          console.log("ユーザーID:", userId);
          
          // userテーブルからユーザー名を取得
          const userDataResult = await supabase
            .from("users")
            .select("username")
            .eq("id", userId)
            .single();
            
          console.log("ユーザーデータ結果:", JSON.stringify(userDataResult));
          
          // ユーザーデータ結果チェック
          if (userDataResult.error) {
            console.error("ユーザーデータ取得エラー:", JSON.stringify(userDataResult.error));
            
            // usersテーブルがない場合は、新しく作成する
            if (userDataResult.error.code === "PGRST116" || userDataResult.error.message?.includes("does not exist")) {
              console.log("usersテーブルが存在しないため、一時的な対応としてメールアドレスをユーザー名として使用");
              
              // メールの@より前の部分をユーザー名として使用
              const emailUsername = userResult.data.user.email?.split('@')[0] || 'user';
              console.log("メールからのユーザー名:", emailUsername);
              
              router.push(`/${emailUsername}`);
              return;
            }
            
            setError(`ユーザープロフィールの取得に失敗しました: ${userDataResult.error.message || "不明なエラー"}`);
            setIsLoggingIn(false);
            return;
          }

          // ユーザー名確認
          const username = userDataResult?.data?.username;
          if (!username) {
            console.error("ユーザー名が見つかりません");
            
            // バックアップ: メールの@より前の部分をユーザー名として使用
            const emailUsername = userResult.data.user.email?.split('@')[0] || 'user';
            console.log("バックアップとしてメールからのユーザー名を使用:", emailUsername);
            
            router.push(`/${emailUsername}`);
            return;
          }
          
          // ページ遷移
          console.log("通常のリダイレクト先:", `/${username}`);
          router.push(`/${username}`);
        } catch (userDataErr) {
          console.error("ユーザーデータ取得失敗:", userDataErr);
          
          // エラー時はメールアドレスからユーザー名を生成して使用
          const emailUsername = userResult.data.user.email?.split('@')[0] || 'user';
          console.log("エラー時のフォールバックユーザー名:", emailUsername);
          
          router.push(`/${emailUsername}`);
        }
      } catch (processingErr) {
        console.error("ログイン処理全体のエラー:", processingErr);
        setError("ログイン処理中にエラーが発生しました");
        setIsLoggingIn(false);
      }
    } catch (outerErr) {
      console.error("予期せぬエラー:", outerErr);
      const errorMessage = outerErr instanceof Error ? outerErr.message : "不明なエラー";
      setError(`ログイン中にエラーが発生しました: ${errorMessage}`);
      setIsLoggingIn(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  /**
   * パスワードリセット処理
   */
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetMessage(null);
    setIsResetting(true);
    
    try {
      // リセットメール送信
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      
      setResetMessage("パスワードリセット用のメールを送信しました。メールボックスを確認してください。");
    } catch (err: unknown) {
      const error = err as AuthError;
      setResetMessage(`エラー: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return {
    // 状態
    signUpUsername,
    setSignUpUsername,
    signUpEmail,
    setSignUpEmail,
    signUpPassword,
    setSignUpPassword,
    loginEmail,
    setLoginEmail,
    loginPassword,
    setLoginPassword,
    isSigningUp,
    isLoggingIn,
    signupComplete,
    showPassword,
    setShowPassword,
    showLoginPassword, 
    setShowLoginPassword,
    rememberMe,
    setRememberMe,
    showResetModal,
    setShowResetModal,
    resetEmail,
    setResetEmail,
    isResetting,
    resetMessage,
    error,
    setError,
    message,
    setMessage,
    fieldErrors,
    setFieldErrors,
    
    // メソッド
    handleSignUp,
    handleLogin,
    handleResetPassword,
    checkIfExists,
  };
}; 