/**
 * 入力検証のためのユーティリティ関数
 */
import { createTranslator } from 'next-intl';

// 言語に基づいてメッセージを取得する関数
const getTranslations = async (locale: string = 'ja') => {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    // 言語ファイルの読み込みに失敗した場合、日本語をフォールバックとして使用
    return (await import('../../../messages/ja.json')).default;
  }
};

// パスワード検証のメッセージを取得する関数
export const getPasswordValidationMessage = async (
  key: 'passwordEmpty' | 'passwordWeak' | 'passwordMedium' | 'passwordStrong',
  locale: string = 'ja'
): Promise<string> => {
  const translations = await getTranslations(locale);
  const t = createTranslator({ locale, messages: translations });
  return t(`Validation.${key}`);
};

/**
 * ユーザー名の検証 - 英数字とアンダースコアのみで3〜20文字
 */
export const validateUsername = (username: string): boolean =>
  /^[a-zA-Z0-9_]{3,20}$/.test(username);

/**
 * メールアドレスの検証
 */
export const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * パスワード強度の検証
 * @param password 検証するパスワード
 * @param messages ローカライズされたメッセージ（オプション）
 * @returns object パスワード強度に関する情報
 */
export const validatePasswordStrength = (
  password: string,
  messages?: {
    passwordEmpty: string;
    passwordWeak: string;
    passwordMedium: string;
    passwordStrong: string;
  }
): { 
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} => {
  // デフォルトメッセージを設定（翻訳が提供されない場合用）
  const defaultMessages = {
    passwordEmpty: 'パスワードが入力されていません',
    passwordWeak: '弱いパスワードです。8文字以上で、大文字、小文字、数字、特殊文字を含めてください。',
    passwordMedium: '中程度のパスワードです。セキュリティを高めるためにより複雑にしてください。',
    passwordStrong: '強いパスワードです。'
  };
  
  // 提供されたメッセージまたはデフォルトメッセージを使用
  const msgs = messages || defaultMessages;
  
  if (!password) {
    return { isValid: false, strength: 'weak', message: msgs.passwordEmpty };
  }
  
  // 強度チェック
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  
  const passedChecks = [
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSpecialChar,
  ].filter(Boolean).length;
  
  if (passedChecks <= 2) {
    return { 
      isValid: false, 
      strength: 'weak', 
      message: msgs.passwordWeak
    };
  } else if (passedChecks <= 4) {
    return { 
      isValid: true, 
      strength: 'medium', 
      message: msgs.passwordMedium
    };
  } else {
    return { 
      isValid: true, 
      strength: 'strong', 
      message: msgs.passwordStrong
    };
  }
}; 