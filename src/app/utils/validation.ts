/**
 * 入力検証のためのユーティリティ関数
 */
import { createTranslator } from 'next-intl';

// 言語に基づいてメッセージを取得する関数
const getTranslations = async (locale: string) => {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Failed to load translations for ${locale}:`, error);
    // 言語ファイルの読み込みに失敗した場合、英語をフォールバックとして使用
    return (await import('../../../messages/en.json')).default;
  }
};

// パスワード検証のメッセージを取得する関数
export const getPasswordValidationMessage = async (
  key: 'passwordEmpty' | 'passwordWeak' | 'passwordMedium' | 'passwordStrong',
  locale: string
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
 * パスワード強度の検証（同期バージョン）
 * すでに翻訳が読み込まれている場合や、メッセージを直接提供する場合に使用します。
 */
export const validatePasswordStrengthSync = (
  password: string,
  messages: {
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
  if (!password) {
    return { isValid: false, strength: 'weak', message: messages.passwordEmpty };
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
      message: messages.passwordWeak
    };
  } else if (passedChecks <= 4) {
    return { 
      isValid: true, 
      strength: 'medium', 
      message: messages.passwordMedium
    };
  } else {
    return { 
      isValid: true, 
      strength: 'strong', 
      message: messages.passwordStrong
    };
  }
};

/**
 * パスワード強度の検証（非同期バージョン）
 * @param password 検証するパスワード
 * @param locale 現在の言語ロケール (例: 'ja', 'en')
 * @param messages 明示的に指定するローカライズメッセージ（オプション）
 * @returns object パスワード強度に関する情報
 */
export const validatePasswordStrength = async (
  password: string,
  locale: string,
  messages?: {
    passwordEmpty: string;
    passwordWeak: string;
    passwordMedium: string;
    passwordStrong: string;
  }
): Promise<{ 
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
}> => {
  // messagesが提供されていない場合は、localeを使って取得
  let msgs = messages;
  if (!msgs) {
    msgs = {
      passwordEmpty: await getPasswordValidationMessage('passwordEmpty', locale),
      passwordWeak: await getPasswordValidationMessage('passwordWeak', locale),
      passwordMedium: await getPasswordValidationMessage('passwordMedium', locale),
      passwordStrong: await getPasswordValidationMessage('passwordStrong', locale)
    };
  }
  
  // 同期関数を再利用
  return validatePasswordStrengthSync(password, msgs);
}; 