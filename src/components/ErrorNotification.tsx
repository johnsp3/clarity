import React, { useEffect, useState } from 'react';
import { X, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { errorLogger, AppError } from '../services/errorHandling';

interface ErrorNotificationProps {
  error: AppError;
  onDismiss: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({ error, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss info messages after 5 seconds
    if (error.severity === 'info') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error.severity, onDismiss]);

  if (!isVisible) return null;

  const getBackgroundColor = () => {
    switch (error.severity) {
      case 'info': return 'bg-blue-500';
      case 'warning': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'critical': return 'bg-red-700';
    }
  };

  const getIcon = () => {
    switch (error.action) {
      case 'Refresh the page to continue':
        return <RefreshCw className="w-5 h-5" />;
      case 'Check your API key in Settings':
        return <Settings className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const handleAction = () => {
    if (error.action === 'Refresh the page to continue') {
      window.location.reload();
    } else if (error.action === 'Check your API key in Settings') {
      // Trigger settings panel open
      const event = new CustomEvent('openSettings', { detail: { tab: 'api' } });
      window.dispatchEvent(event);
      onDismiss();
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${getBackgroundColor()}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium">{error.userMessage || error.message}</p>
          {error.action && (
            <div className="mt-2">
              <button
                onClick={handleAction}
                className="text-sm underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
              >
                {error.action}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="ml-4 flex-shrink-0 inline-flex text-white hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Error notification manager component
export const ErrorNotificationManager: React.FC = () => {
  const [errors, setErrors] = useState<AppError[]>([]);

  useEffect(() => {
    // Poll for new errors every second
    const interval = setInterval(() => {
      const recentErrors = errorLogger.getRecentErrors(5);
      // Filter out Firebase initialization messages and only show user-facing errors
      const filteredErrors = recentErrors.filter(error => {
        // Skip Firebase initialization success messages
        if (error.message.includes('Firebase initialized successfully')) return false;
        // Only show errors that have user messages or are warnings/errors
        return error.userMessage || error.severity !== 'info';
      });
      
      const newErrors = filteredErrors.filter(
        error => !errors.some(e => e.timestamp === error.timestamp)
      );
      
      if (newErrors.length > 0) {
        setErrors(prev => [...newErrors, ...prev].slice(0, 5)); // Keep max 5 errors
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [errors]);

  const dismissError = (timestamp: Date) => {
    setErrors(prev => prev.filter(e => e.timestamp !== timestamp));
  };

  return (
    <div className="fixed bottom-0 right-0 z-50 pointer-events-none">
      <div className="flex flex-col gap-2 p-4 pointer-events-auto">
        {errors.map((error) => (
          <ErrorNotification
            key={error.timestamp.toISOString()}
            error={error}
            onDismiss={() => dismissError(error.timestamp)}
          />
        ))}
      </div>
    </div>
  );
}; 