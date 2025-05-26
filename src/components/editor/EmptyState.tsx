import React from 'react'
import { FileText } from 'lucide-react'

export const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-[#FAFAFA]">
      <div className="text-center max-w-md">
        {/* Simple icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
            <FileText size={48} className="text-gray-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          No Note Selected
        </h2>
        
        <p className="text-gray-600 mb-8">
          Select a note from the list or create a new one to get started.
        </p>
        
        {/* Keyboard shortcut hint */}
        <p className="text-sm text-gray-500">
          or press{" "}
          <kbd className="px-2 py-1 bg-white rounded border border-gray-200 font-mono text-xs">
            ⌘N
          </kbd>
        </p>
      </div>
    </div>
  )
} 