import React from 'react'
import { FileText } from 'lucide-react'

export const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-white">
      <div className="text-center max-w-md">
        {/* Simple icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-[#F5F5F7] rounded-lg flex items-center justify-center">
            <FileText size={48} className="text-[#86868B]" />
          </div>
        </div>
        
        <h2 className="text-apple-title-md mb-2">
          No Note Selected
        </h2>
        
        <p className="text-apple-body-secondary mb-8">
          Select a note from the list or create a new one to get started.
        </p>
        
        {/* Keyboard shortcut hint */}
        <p className="text-apple-caption">
          or press{" "}
          <kbd className="px-2 py-1 bg-white rounded border border-[#D2D2D7] font-mono text-[13px]">
            ⌘N
          </kbd>
        </p>
      </div>
    </div>
  )
} 