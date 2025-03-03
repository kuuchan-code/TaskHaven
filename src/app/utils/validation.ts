/**
 * 入力検証のためのユーティリティ関数
 */

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
 * @returns object パスワード強度に関する情報
 */
export const validatePasswordStrength = (password: string): { 
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} => {
  if (!password) {
    return { isValid: false, strength: 'weak', message: 'パスワードが入力されていません' };
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
      message: '弱いパスワードです。8文字以上で、大文字、小文字、数字、特殊文字を含めてください。' 
    };
  } else if (passedChecks <= 4) {
    return { 
      isValid: true, 
      strength: 'medium', 
      message: '中程度のパスワードです。セキュリティを高めるためにより複雑にしてください。' 
    };
  } else {
    return { 
      isValid: true, 
      strength: 'strong', 
      message: '強いパスワードです。' 
    };
  }
}; 