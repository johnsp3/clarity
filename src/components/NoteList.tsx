import React from 'react'
import { Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { Button } from './Button'

export const NoteList: React.FC = () => {
  const {
    filteredNotes,
    activeNoteId,
    setActiveNote,
    addNote,
  } = useStore()

  const notes = filteredNotes()

  const handleCreateNote = () => {
    addNote({
      title: 'Untitled Note',
      content: '',
      projectId: null,
      folderId: null,
      tags: [],
      type: 'markdown',
      hasImages: false,
      hasCode: false,
      format: 'markdown',
    })
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getPreview = (content: string) => {
    const lines = content.split('\n').filter(line => line.trim())
    return lines.slice(0, 2).join(' ')
  }

  return (
    <div className="w-[300px] h-full bg-white border-r border-[#E5E5E7] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E5E7] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1A1A1A]">Notes</h2>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCreateNote}
          className="p-1.5"
        >
          <Plus size={18} />
        </Button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {notes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-[#6B6B6B] p-4 text-center"
            >
              <p className="mb-4">No notes yet</p>
              <Button onClick={handleCreateNote}>
                <Plus size={16} className="mr-2" />
                Create your first note
              </Button>
            </motion.div>
          ) : (
            <div className="divide-y divide-[#E5E5E7]">
              {notes.map((note, index) => (
                <motion.button
                  key={note.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setActiveNote(note.id)}
                  className={`w-full text-left p-4 hover:bg-[#FAFAFA] transition-colors ${
                    activeNoteId === note.id ? 'bg-[#E5F0FF]' : ''
                  }`}
                >
                  <h3 className={`font-medium text-sm mb-1 ${
                    activeNoteId === note.id ? 'text-[#0F62FE]' : 'text-[#1A1A1A]'
                  }`}>
                    {note.title || 'Untitled'}
                  </h3>
                  {note.content && (
                    <p className="text-xs text-[#6B6B6B] line-clamp-2 mb-2">
                      {getPreview(note.content)}
                    </p>
                  )}
                  <time className="text-xs text-[#6B6B6B]">
                    {formatDate(note.updatedAt)}
                  </time>
                </motion.button>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 