import React, { memo } from 'react'
import { Note } from '../store/useStore'
import { formatDistanceToNow } from 'date-fns'
import { FileText, Image, Code, Star } from 'lucide-react'

interface MemoizedNoteCardProps {
  note: Note
  isActive: boolean
  isSelected: boolean
  isFavorite: boolean
  onClick: () => void
  onToggleSelection: () => void
  onToggleFavorite: () => void
}

const MemoizedNoteCard: React.FC<MemoizedNoteCardProps> = memo(({
  note,
  isActive,
  isSelected,
  isFavorite,
  onClick,
  onToggleSelection,
  onToggleFavorite
}) => {
  const getPreviewText = (content: string): string => {
    // Remove HTML tags and get first 100 characters
    const plainText = content.replace(/<[^>]*>/g, '').trim()
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
  }

  const formatDate = (date: Date): string => {
    try {
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return 'Unknown'
    }
  }

  return (
    <div
      className={`note-card group relative ${isActive ? 'note-card-active' : ''}`}
      onClick={onClick}
    >
      {/* Selection checkbox */}
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
        />
      </div>

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggleFavorite()
        }}
        className={`absolute top-3 right-3 p-1 rounded transition-all ${
          isFavorite 
            ? 'text-yellow-500 opacity-100' 
            : 'text-gray-400 opacity-0 group-hover:opacity-100'
        }`}
      >
        <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      {/* Note content */}
      <div className="pl-6 pr-8">
        <div className="flex items-start justify-between mb-2">
          <h3 className={`font-medium text-[15px] leading-tight ${
            note.titleColor ? `text-[${note.titleColor}]` : 'text-[#1D1D1F]'
          }`}>
            {note.title || 'Untitled'}
          </h3>
        </div>

        {/* Preview text */}
        {note.content && (
          <p className="text-[13px] text-[#86868B] leading-relaxed mb-3 line-clamp-2">
            {getPreviewText(note.content)}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Content indicators */}
            <div className="flex items-center gap-1">
              <FileText size={12} className="text-[#86868B]" />
              {note.hasImages && <Image size={12} className="text-[#86868B]" />}
              {note.hasCode && <Code size={12} className="text-[#86868B]" />}
            </div>

            {/* Tags */}
            {note.tags.length > 0 && (
              <div className="flex items-center gap-1">
                {note.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-gray-100 text-[11px] text-gray-600 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 2 && (
                  <span className="text-[11px] text-gray-500">
                    +{note.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Date */}
          <span className="text-[11px] text-[#86868B]">
            {formatDate(note.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.note.id === nextProps.note.id &&
    prevProps.note.title === nextProps.note.title &&
    prevProps.note.content === nextProps.note.content &&
    prevProps.note.updatedAt.getTime() === nextProps.note.updatedAt.getTime() &&
    prevProps.note.tags.length === nextProps.note.tags.length &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isFavorite === nextProps.isFavorite
  )
})

MemoizedNoteCard.displayName = 'MemoizedNoteCard'

export { MemoizedNoteCard } 