import React from 'react'
import { useStore } from '../store/useStore'
import { RichTextEditor } from './editor/RichTextEditor'
import { EmptyState } from './editor/EmptyState'

export const Editor: React.FC = () => {
  const { activeNote, updateNote } = useStore()
  const note = activeNote()

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {!note ? (
        <EmptyState />
      ) : (
        <RichTextEditor 
          note={note} 
          onUpdate={(updates) => updateNote(note.id, updates)} 
        />
      )}
    </div>
  )
} 