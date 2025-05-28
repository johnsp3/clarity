import React from 'react';
import { AlertCircle, Zap, WifiOff, Key } from 'lucide-react';
import { errorLogger, handleApiError, handleFirebaseError } from '../services/errorHandling';

export const ErrorHandlingDemo: React.FC = () => {
  const triggerApiError = (type: string) => {
    switch (type) {
      case 'rate-limit':
        handleApiError({
          message: 'Rate limit exceeded',
          status: 429,
          code: 'rate_limit'
        }, 'OpenAI');
        break;
      case 'invalid-key':
        handleApiError({
          message: 'Invalid API key',
          status: 401,
          code: 'invalid_api_key'
        }, 'ChatGPT');
        break;
      case 'timeout':
        handleApiError({
          message: 'Request timeout',
          status: 408,
          code: 'timeout'
        }, 'Perplexity');
        break;
      case 'network':
        errorLogger.log({
          message: 'Network connection lost',
          severity: 'error',
          category: 'network',
          userMessage: 'Unable to connect to the internet',
          action: 'Check your connection and try again'
        });
        break;
    }
  };

  const triggerFirebaseError = (type: string) => {
    switch (type) {
      case 'permission':
        handleFirebaseError({
          code: 'permission-denied',
          message: 'Permission denied'
        }, 'save note');
        break;
      case 'quota':
        handleFirebaseError({
          message: 'Quota exceeded',
          code: 'resource-exhausted'
        }, 'load data');
        break;
    }
  };

  const triggerInfo = () => {
    errorLogger.log({
      message: 'Operation completed successfully',
      severity: 'info',
      category: 'unknown',
      userMessage: 'Your note has been saved',
      details: { noteId: '123', timestamp: new Date() }
    });
  };

  return (
    <div className="fixed bottom-20 left-4 bg-gray-800 p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        Error Handling Demo
      </h3>
      
      <div className="space-y-2">
        <div className="text-sm text-gray-400 mb-2">API Errors:</div>
        <button
          onClick={() => triggerApiError('rate-limit')}
          className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Trigger Rate Limit Error
        </button>
        <button
          onClick={() => triggerApiError('invalid-key')}
          className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white flex items-center gap-2"
        >
          <Key className="w-4 h-4" />
          Trigger Invalid API Key
        </button>
        <button
          onClick={() => triggerApiError('network')}
          className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white flex items-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          Trigger Network Error
        </button>
        
        <div className="text-sm text-gray-400 mb-2 mt-3">Firebase Errors:</div>
        <button
          onClick={() => triggerFirebaseError('permission')}
          className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
        >
          Trigger Permission Error
        </button>
        
        <div className="text-sm text-gray-400 mb-2 mt-3">Success:</div>
        <button
          onClick={triggerInfo}
          className="w-full text-left px-3 py-2 bg-green-700 hover:bg-green-600 rounded text-sm text-white"
        >
          Trigger Success Message
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        Click buttons to see error notifications
      </p>
    </div>
  );
}; 