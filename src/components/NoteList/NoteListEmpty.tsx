import React from 'react'
import { FileText, Plus } from 'lucide-react'

interface NoteListEmptyProps {
  onCreateNote: () => void
}

export const NoteListEmpty: React.FC<NoteListEmptyProps> = ({ onCreateNote }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileText size={40} className="text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No notes yet
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-sm">
        Create your first note to start organizing your thoughts and ideas
      </p>
      
      <button
        onClick={onCreateNote}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        aria-label="Create your first note"
      >
        <Plus size={20} />
        Create Your First Note
      </button>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>Tips to get started:</p>
        <ul className="mt-2 space-y-1 text-left">
          <li>• Use <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">⌘K</kbd> to open quick actions</li>
          <li>• Organize notes with projects and folders</li>
          <li>• Add tags for easy searching</li>
          <li>• Star important notes for quick access</li>
        </ul>
      </div>
    </div>
  )
} 