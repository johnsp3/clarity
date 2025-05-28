import React, { memo, useState } from 'react'
import { Note, useStore } from '../store/useStore'
import { Clock, Hash, FileText, CheckSquare, Code, Link2, List, Star } from 'lucide-react'

interface MemoizedNoteCardProps {
  note: Note
  isActive: boolean
  isSelected: boolean
  isFavorite: boolean
  hasSelectedNotes?: boolean
  onClick: () => void
  onToggleSelection: () => void
  onToggleFavorite: () => void
}

const MemoizedNoteCard: React.FC<MemoizedNoteCardProps> = memo(({
  note,
  isActive,
  isSelected,
  isFavorite,
  hasSelectedNotes = false,
  onClick,
  onToggleSelection,
  onToggleFavorite
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const tags = useStore(state => state.tags)

  // Get tag objects for this note
  const noteTags = note.tags
    .map(tagId => tags.find(tag => tag.id === tagId))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined)

  // Format timestamp for display
  const formatTimestamp = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffMinutes < 1) return 'just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    // For older dates, show the actual date
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  // Get full timestamp for tooltip
  const getFullTimestamp = (date: Date): string => {
    return date.toLocaleString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div
      className={`
        group relative p-4 mb-3 bg-white rounded-lg border transition-all duration-200 cursor-pointer
        ${isActive 
          ? 'border-cyan-500 shadow-lg shadow-cyan-500/10 ring-2 ring-cyan-500/20' 
          : 'border-gray-200 hover:border-gray-300'
        }
        ${isHovered ? 'transform -translate-y-0.5 shadow-md' : 'shadow-sm'}
      `}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        className={`absolute top-4 right-4 p-1 rounded transition-all ${
          isFavorite 
            ? 'text-yellow-500 opacity-100' 
            : 'text-gray-400 opacity-0 hover:opacity-100'
        }`}
      >
        <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-between pr-8">
        <span style={{ color: note.titleColor || undefined }}>
          {note.title || 'Untitled'}
        </span>
        {note.metadata?.hasAttachments && <FileText className="w-4 h-4 text-gray-400" />}
      </h3>
      
      {/* Rich Preview Content */}
      {note.preview && note.preview.length > 0 && (
        <div className="text-sm text-gray-600 space-y-1.5 mb-3">
          {note.preview.map((block, index) => {
            switch (block.type) {
              case 'text':
                return (
                  <p key={index} className="line-clamp-2">
                    {/* Parse bold text */}
                    {block.content?.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="text-gray-800 font-medium">{part.slice(2, -2)}</strong>
                      }
                      return <span key={i}>{part}</span>
                    })}
                  </p>
                )
              case 'checklist':
                return (
                  <div key={index} className="flex items-center gap-2">
                    <CheckSquare className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                    <span className="text-gray-700">
                      {block.completed}/{block.total} tasks
                      {block.completed === block.total && (block.total ?? 0) > 0 && 
                        <span className="ml-1 text-green-600 text-xs">✓ Complete</span>
                      }
                    </span>
                  </div>
                )
              case 'code':
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                    <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-mono">
                      {block.language}: {block.preview}
                    </code>
                  </div>
                )
              case 'list':
                return (
                  <div key={index} className="flex items-center gap-2">
                    <List className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">{block.items} items</span>
                  </div>
                )
              case 'link':
                return (
                  <div key={index} className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <span className="text-blue-600 text-xs truncate">{block.url}</span>
                  </div>
                )
              default:
                return null
            }
          })}
        </div>
      )}
      
      {/* Tags */}
      {noteTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {noteTags.map((tag) => (
            <span 
              key={tag.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white bg-gradient-to-r ${tag.color}`}
            >
              <Hash className="w-2.5 h-2.5" />
              {tag.name}
            </span>
          ))}
        </div>
      )}
      
      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {/* Timestamp display */}
          <span className="flex items-center gap-1 group/time" title={getFullTimestamp(note.updatedAt)}>
            <Clock className="w-3 h-3 group-hover/time:text-gray-700 transition-colors" />
            <span className="group-hover/time:text-gray-700 transition-colors">
              {formatTimestamp(note.updatedAt)}
            </span>
          </span>
          
          {/* Separator */}
          <span className="text-gray-300">•</span>
          
          {/* Word count */}
          <span>{note.metadata?.wordCount || 0} words</span>
          
          {/* Show if modified after creation */}
          {note.createdAt.getTime() !== note.updatedAt.getTime() && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-gray-400 italic text-[11px]">edited</span>
            </>
          )}
        </div>
        
        {/* Completion percentage for checklists */}
        {note.metadata?.hasCheckboxes && (
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${note.metadata.completionPercentage || 0}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">{note.metadata.completionPercentage || 0}%</span>
          </div>
        )}
      </div>

      {/* Selection checkbox - moved to bottom right */}
      <div className={`absolute bottom-4 right-4 transition-opacity ${
        hasSelectedNotes || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-cyan-600 bg-gray-100 border-gray-300 rounded-full focus:ring-cyan-500 cursor-pointer"
        />
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.updatedAt.getTime() === nextProps.note.updatedAt.getTime() &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isFavorite === nextProps.isFavorite &&
    JSON.stringify(prevProps.note.tags) === JSON.stringify(nextProps.note.tags)
  )
})

MemoizedNoteCard.displayName = 'MemoizedNoteCard'

export { MemoizedNoteCard } 