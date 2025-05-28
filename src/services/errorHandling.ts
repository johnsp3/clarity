// Centralized Error Handling and Logging Service

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ErrorCategory = 'api' | 'firebase' | 'auth' | 'storage' | 'network' | 'validation' | 'unknown';

export interface AppError {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  details?: any;
  stack?: string;
  code?: string;
  userMessage?: string; // User-friendly message
  action?: string; // Suggested action for the user
}

// Error logger with emoji indicators for easy console scanning
export class ErrorLogger {
  private static instance: ErrorLogger;
  private errors: AppError[] = [];
  private maxErrors = 100; // Keep last 100 errors in memory

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private getEmoji(severity: ErrorSeverity): string {
    switch (severity) {
      case 'info': return '💡';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'critical': return '🔥';
    }
  }

  private getCategoryEmoji(category: ErrorCategory): string {
    switch (category) {
      case 'api': return '🌐';
      case 'firebase': return '🔥';
      case 'auth': return '🔐';
      case 'storage': return '💾';
      case 'network': return '📡';
      case 'validation': return '✅';
      case 'unknown': return '❓';
    }
  }

  log(error: Omit<AppError, 'timestamp'>): void {
    const fullError: AppError = {
      ...error,
      timestamp: new Date()
    };

    // Add to memory store
    this.errors.unshift(fullError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Console logging with formatting
    const emoji = this.getEmoji(error.severity);
    const categoryEmoji = this.getCategoryEmoji(error.category);
    
    console.group(`${emoji} ${categoryEmoji} [${error.severity.toUpperCase()}] ${error.category}`);
    console.log(`📝 Message: ${error.message}`);
    
    if (error.userMessage) {
      console.log(`👤 User Message: ${error.userMessage}`);
    }
    
    if (error.action) {
      console.log(`💡 Suggested Action: ${error.action}`);
    }
    
    if (error.code) {
      console.log(`🔢 Error Code: ${error.code}`);
    }
    
    if (error.details) {
      console.log('📊 Details:', error.details);
    }
    
    if (error.stack && error.severity === 'error' || error.severity === 'critical') {
      console.log('📚 Stack:', error.stack);
    }
    
    console.log(`⏰ Time: ${fullError.timestamp.toLocaleTimeString()}`);
    console.groupEnd();

    // Store critical errors in localStorage for debugging
    if (error.severity === 'critical') {
      this.storeCriticalError(fullError);
    }
  }

  private storeCriticalError(error: AppError): void {
    try {
      const stored = localStorage.getItem('clarity_critical_errors');
      const errors = stored ? JSON.parse(stored) : [];
      errors.unshift({
        ...error,
        timestamp: error.timestamp.toISOString()
      });
      // Keep only last 10 critical errors
      localStorage.setItem('clarity_critical_errors', JSON.stringify(errors.slice(0, 10)));
    } catch (e) {
      console.error('Failed to store critical error:', e);
    }
  }

  getRecentErrors(count: number = 10): AppError[] {
    return this.errors.slice(0, count);
  }

  clearErrors(): void {
    this.errors = [];
  }

  getCriticalErrors(): AppError[] {
    try {
      const stored = localStorage.getItem('clarity_critical_errors');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}

// Singleton instance
export const errorLogger = ErrorLogger.getInstance();

// Helper function to create user-friendly error messages
export function createUserMessage(error: any, category: ErrorCategory): { message: string; action: string } {
  // API Errors
  if (category === 'api') {
    if (error.message?.includes('rate limit') || error.status === 429) {
      return {
        message: 'You\'ve hit the API rate limit. Please wait a moment before trying again.',
        action: 'Wait 60 seconds and try again'
      };
    }
    if (error.message?.includes('401') || error.status === 401) {
      return {
        message: 'Your API key appears to be invalid or expired.',
        action: 'Check your API key in Settings'
      };
    }
    if (error.message?.includes('timeout')) {
      return {
        message: 'The API request took too long to respond.',
        action: 'Check your internet connection and try again'
      };
    }
    if (error.status === 500 || error.status === 503) {
      return {
        message: 'The API service is temporarily unavailable.',
        action: 'Try again in a few minutes'
      };
    }
  }

  // Firebase Errors
  if (category === 'firebase') {
    if (error.code === 'permission-denied') {
      return {
        message: 'You don\'t have permission to access this data.',
        action: 'Make sure you\'re signed in with the correct account'
      };
    }
    if (error.code === 'unavailable') {
      return {
        message: 'Cannot connect to Firebase. Check your internet connection.',
        action: 'Check your connection and refresh the page'
      };
    }
    if (error.message?.includes('quota')) {
      return {
        message: 'Firebase quota exceeded for today.',
        action: 'Try again tomorrow or upgrade your Firebase plan'
      };
    }
  }

  // Auth Errors
  if (category === 'auth') {
    if (error.code === 'auth/popup-closed-by-user') {
      return {
        message: 'Sign-in was cancelled.',
        action: 'Click sign in again to continue'
      };
    }
    if (error.code === 'auth/popup-blocked') {
      return {
        message: 'Sign-in popup was blocked by your browser.',
        action: 'Allow popups for this site and try again'
      };
    }
    if (error.message?.includes('unauthorized email')) {
      return {
        message: 'This email is not authorized to use this app.',
        action: 'Sign in with your authorized email address'
      };
    }
  }

  // Network Errors
  if (category === 'network') {
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        message: 'Network connection lost.',
        action: 'Check your internet connection'
      };
    }
  }

  // Default messages
  return {
    message: 'Something went wrong. Please try again.',
    action: 'Refresh the page or contact support if the issue persists'
  };
}

// Error boundary helper
export function logErrorBoundary(error: Error, errorInfo: any): void {
  errorLogger.log({
    message: error.message,
    severity: 'critical',
    category: 'unknown',
    stack: error.stack,
    details: errorInfo,
    userMessage: 'The app encountered an unexpected error.',
    action: 'Refresh the page to continue'
  });
}

// API error handler
export function handleApiError(error: any, apiName: string): void {
  const { message, action } = createUserMessage(error, 'api');
  
  errorLogger.log({
    message: `${apiName} API Error: ${error.message || 'Unknown error'}`,
    severity: error.status >= 500 ? 'error' : 'warning',
    category: 'api',
    code: error.status?.toString(),
    details: {
      api: apiName,
      status: error.status,
      response: error.response
    },
    userMessage: message,
    action: action
  });
}

// Firebase error handler
export function handleFirebaseError(error: any, operation: string): void {
  const { message, action } = createUserMessage(error, 'firebase');
  
  errorLogger.log({
    message: `Firebase ${operation} Error: ${error.message || 'Unknown error'}`,
    severity: 'error',
    category: 'firebase',
    code: error.code,
    details: {
      operation,
      code: error.code
    },
    userMessage: message,
    action: action
  });
}

// Success logger for important operations
export function logSuccess(message: string, details?: any): void {
  errorLogger.log({
    message,
    severity: 'info',
    category: 'unknown',
    details
  });
} 