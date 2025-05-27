import React, { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, XCircle, X } from 'lucide-react'
import type { ToastMessage } from '../hooks/useToast'

interface ToastProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation
    setIsVisible(true)

    // Auto dismiss
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(() => onDismiss(toast.id), 200)
    }, toast.duration || 4000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />
  }

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200', 
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <div
      className={`
        transform transition-all duration-200 ease-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${bgColors[toast.type]}
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        {icons[toast.type]}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {toast.title}
          </p>
          {toast.message && (
            <p className="text-sm text-gray-600 mt-1">
              {toast.message}
            </p>
          )}
        </div>

        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onDismiss(toast.id), 200)
          }}
          className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
} 