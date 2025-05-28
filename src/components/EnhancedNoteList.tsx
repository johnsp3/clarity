import React, { useState } from 'react'
import { 
  Plus, Grid, List as ListIcon, AlignLeft, SortDesc,
  Calendar, Edit2, Star, Check, X,
  FileText, Image, Code, Hash
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Checkbox from '@radix-ui/react-checkbox'
import { useOptimizedStore } from '../hooks/useOptimizedStore'
import { Note } from '../store/useStore'
import { BreadcrumbNav } from './BreadcrumbNav'
import { MemoizedNoteCard } from './MemoizedNoteCard'
import { 
  announceToScreenReader,
  formatNumberForScreenReader 
} from '../utils/accessibility'

export const EnhancedNoteList: React.FC = () => {
  const {
    projects,
    filteredNotes,
    activeNoteId,
    activeProjectId,
    selectedNoteIds,
    viewMode,
    setActiveNote,
    toggleNoteSelection,
    clearSelection,
    selectAll,
    deleteNotes,
    setViewMode,
    addNote,
    favoriteNoteIds,
    toggleFavorite,
    activeFolderId,
    searchFilters,
    tags,
    setSearchFilters,
  } = useOptimizedStore()

  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  const sortedNotes = filteredNotes

  const handleCreateNote = () => {
    if (newNoteTitle.trim()) {
      addNote({
        title: newNoteTitle.trim(),
        content: '',
        projectId: activeProjectId,
        folderId: activeFolderId,
        tags: [],
        type: 'markdown',
        hasImages: false,
        hasCode: false,
        format: 'markdown',
        preview: [],
        metadata: {
          wordCount: 0,
          lastEditedRelative: 'just now',
          hasCheckboxes: false,
          taskCount: 0,
          completedTasks: 0,
          completionPercentage: 0,
          hasAttachments: false,
          hasCode: false,
          hasLinks: false
        }
      })
      setNewNoteTitle('')
      setIsCreatingNote(false)
      announceToScreenReader('New note created')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedNoteIds.size > 0) {
      try {
        await deleteNotes(Array.from(selectedNoteIds))
        clearSelection()
        announceToScreenReader(`${selectedNoteIds.size} notes deleted`)
      } catch (error) {
        console.error('Failed to delete notes:', error)
        announceToScreenReader('Failed to delete notes')
      }
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Grid View Item
  const GridViewItem: React.FC<{ note: Note; index: number }> = ({ note }) => {
    const isSelected = selectedNoteIds.has(note.id)
    const isActive = activeNoteId === note.id
    const isFavorite = favoriteNoteIds.has(note.id)

    return (
      <div
        className={`group p-4 rounded-lg bg-white border cursor-pointer relative
                  transition-all duration-200 ${
                    isActive
                      ? 'border-blue-500 shadow-sm'
                      : 'border-gray-300 hover:border-gray-500 hover:shadow-sm'
                  } ${isSelected ? 'ring-2 ring-blue-200 border-blue-400' : ''}`}
        onClick={() => setActiveNote(note.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`text-[15px] line-clamp-2 ${
            isActive ? 'font-medium text-gray-900' : 'font-normal text-gray-900'
          } ${isSelected ? 'text-blue-600 font-medium' : ''}`}>
            {note.title}
          </h3>
        </div>

        {/* Content preview */}
        <p className="text-[13px] text-gray-500 line-clamp-3 mb-3">
          {note.content || 'No content yet...'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-500">
            {formatDate(note.updatedAt)}
          </span>
          
          <div className="flex items-center gap-2">
            {note.hasImages && <Image size={12} className="text-gray-500" />}
            {note.hasCode && <Code size={12} className="text-gray-500" />}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(note.id)
              }}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                isFavorite ? 'text-yellow-600 opacity-100' : 'text-gray-500'
              }`}
            >
              <Star size={12} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Selection checkbox - moved to bottom right */}
        <Checkbox.Root
          checked={isSelected}
          onCheckedChange={() => toggleNoteSelection(note.id)}
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer
                   transition-all duration-200 ease-out ${
                     selectedNoteIds.size > 0 || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                   } ${isSelected 
                     ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] shadow-sm' 
                     : 'border-gray-300 bg-white hover:border-[var(--accent-primary)] hover:bg-blue-50'
                   }`}
        >
          <Checkbox.Indicator className="flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white font-bold" strokeWidth={3} />
          </Checkbox.Indicator>
        </Checkbox.Root>
      </div>
    )
  }

  // Compact View Item
  const CompactViewItem: React.FC<{ note: Note; index: number }> = ({ note }) => {
    const isSelected = selectedNoteIds.has(note.id)
    const isActive = activeNoteId === note.id
    const isFavorite = favoriteNoteIds.has(note.id)

    return (
      <div
        className={`group px-4 py-2 border-b border-gray-200 cursor-pointer
                  transition-colors duration-200 ${
                    isActive
                      ? 'bg-gray-100 border-l-2 border-l-blue-500'
                      : 'hover:bg-gray-100'
                  } ${isSelected ? 'bg-blue-50 border-l-2 border-l-blue-400' : ''}`}
        onClick={() => setActiveNote(note.id)}
      >
        <div className="flex items-center gap-3">
          <FileText size={14} className="text-gray-500 flex-shrink-0" />
          
          <span className={`flex-1 truncate text-[15px] ${
            isActive ? 'font-medium text-gray-900' : 'text-gray-900'
          } ${isSelected ? 'text-blue-600 font-medium' : ''}`}>
            {note.title}
          </span>
          
          <div className="flex items-center gap-2 text-[13px] text-gray-500">
            {note.hasImages && <Image size={12} />}
            {note.hasCode && <Code size={12} />}
            <span>{formatDate(note.updatedAt)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(note.id)
              }}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                isFavorite ? 'text-yellow-600 opacity-100' : 'text-gray-500'
              }`}
            >
              <Star size={12} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Selection checkbox - moved to the right */}
          <Checkbox.Root
            checked={isSelected}
            onCheckedChange={() => toggleNoteSelection(note.id)}
            onClick={(e) => e.stopPropagation()}
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer
                     transition-all duration-200 ease-out ${
                       selectedNoteIds.size > 0 || isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                     } ${isSelected 
                       ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] shadow-sm' 
                       : 'border-gray-300 bg-white hover:border-[var(--accent-primary)] hover:bg-blue-50'
                     }`}
          >
            <Checkbox.Indicator className="flex items-center justify-center">
              <Check className="w-3.5 h-3.5 text-white font-bold" strokeWidth={3} />
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>
      </div>
    )
  }

  return (
    <div className="w-[400px] flex flex-col h-screen bg-[var(--bg-primary)] border-r border-[var(--border-light)] shadow-[var(--shadow-xs)] overflow-hidden" role="region" aria-label="Notes list">
      {/* Breadcrumb Navigation */}
      <div className="flex-shrink-0">
        <BreadcrumbNav />
      </div>
      
      {/* Header */}
      <div className="border-b border-[var(--border-light)] p-6 bg-[var(--bg-primary)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            {activeProjectId ? (
              <>
                <h2 className="text-apple-title-sm" id="notes-list-title">
                  {projects.find(p => p.id === activeProjectId)?.name}
                </h2>
                <p className="text-apple-caption mt-1" aria-live="polite">
                  {formatNumberForScreenReader(sortedNotes.length, 'note', 'notes')}
                </p>
              </>
            ) : (
              <p className="text-[15px] font-medium text-[var(--text-primary)]" aria-live="polite">
                {formatNumberForScreenReader(sortedNotes.length, 'note', 'notes')}
              </p>
            )}
          </div>

          {/* View Options */}
          <div className="flex items-center gap-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="btn-apple-ghost text-[13px] px-3 py-2 flex items-center gap-1" aria-label={`Sort by ${viewMode.sortBy}, ${viewMode.sortOrder === 'asc' ? 'ascending' : 'descending'}`}>
                  <SortDesc size={14} className={viewMode.sortOrder === 'asc' ? 'rotate-180' : ''} aria-hidden="true" />
                  <span>Sort</span>
                  <span className="text-[11px] text-gray-500">
                    ({viewMode.sortBy === 'modified' ? 'Modified' : 
                      viewMode.sortBy === 'created' ? 'Created' : 
                      viewMode.sortBy === 'title' ? 'Title' : 'Manual'})
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="dropdown-apple min-w-[180px] z-apple-dropdown animate-apple-scale-in"
                  sideOffset={5}
                >
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ ...viewMode, sortBy: 'modified' })}
                    className="dropdown-item-apple"
                  >
                    <Calendar size={16} className="text-gray-500" aria-hidden="true" />
                    Last Modified
                    {viewMode.sortBy === 'modified' && <Check size={16} className="ml-auto text-blue-500" aria-hidden="true" />}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ ...viewMode, sortBy: 'created' })}
                    className="dropdown-item-apple"
                  >
                    <Calendar size={16} className="text-gray-500" aria-hidden="true" />
                    Date Created
                    {viewMode.sortBy === 'created' && <Check size={16} className="ml-auto text-blue-500" aria-hidden="true" />}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ ...viewMode, sortBy: 'title' })}
                    className="dropdown-item-apple"
                  >
                    <Edit2 size={16} className="text-gray-500" aria-hidden="true" />
                    Title
                    {viewMode.sortBy === 'title' && <Check size={16} className="ml-auto text-blue-500" aria-hidden="true" />}
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="divider-apple my-1" />
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ 
                      ...viewMode, 
                      sortOrder: viewMode.sortOrder === 'asc' ? 'desc' : 'asc' 
                    })}
                    className="dropdown-item-apple"
                  >
                    {viewMode.sortOrder === 'asc' ? (
                      <>
                        <SortDesc size={16} className="text-gray-500" aria-hidden="true" />
                        Sort Descending
                      </>
                    ) : (
                      <>
                        <SortDesc size={16} className="text-gray-500 rotate-180" aria-hidden="true" />
                        Sort Ascending
                      </>
                    )}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg p-1 shadow-[var(--shadow-xs)]" role="group" aria-label="View options">
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'list' })}
                className={`p-2 rounded-md transition-all var(--transition-fast) ${
                  viewMode.type === 'list' 
                    ? 'bg-[var(--bg-primary)] shadow-[var(--shadow-sm)] text-[var(--accent-primary)]' 
                    : 'hover:bg-[var(--bg-primary)] hover:bg-opacity-50 text-[var(--text-secondary)]'
                }`}
                title="List view"
                aria-label="List view"
                aria-pressed={viewMode.type === 'list'}
              >
                <ListIcon size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'grid' })}
                className={`p-2 rounded-md transition-all var(--transition-fast) ${
                  viewMode.type === 'grid' 
                    ? 'bg-[var(--bg-primary)] shadow-[var(--shadow-sm)] text-[var(--accent-primary)]' 
                    : 'hover:bg-[var(--bg-primary)] hover:bg-opacity-50 text-[var(--text-secondary)]'
                }`}
                title="Grid view"
                aria-label="Grid view"
                aria-pressed={viewMode.type === 'grid'}
              >
                <Grid size={16} aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'compact' })}
                className={`p-2 rounded-md transition-all var(--transition-fast) ${
                  viewMode.type === 'compact' 
                    ? 'bg-[var(--bg-primary)] shadow-[var(--shadow-sm)] text-[var(--accent-primary)]' 
                    : 'hover:bg-[var(--bg-primary)] hover:bg-opacity-50 text-[var(--text-secondary)]'
                }`}
                title="Compact view"
                aria-label="Compact view"
                aria-pressed={viewMode.type === 'compact'}
              >
                <AlignLeft size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {/* Tag Filter Indicator */}
        {searchFilters.tags && searchFilters.tags.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-[13px] text-gray-600">Filtered by:</span>
            {searchFilters.tags.map(tagId => {
              const tag = tags.find(t => t.id === tagId)
              if (!tag) return null
              return (
                <div
                  key={tag.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r ${tag.color} 
                           text-white rounded-full font-medium group hover:scale-105 transition-transform`}
                >
                  <Hash size={12} strokeWidth={1.5} />
                  {tag.name}
                  <button
                    onClick={() => {
                      const newTags = searchFilters.tags?.filter(id => id !== tagId) || []
                      setSearchFilters({
                        ...searchFilters,
                        tags: newTags.length > 0 ? newTags : undefined
                      })
                    }}
                    className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${tag.name} filter`}
                  >
                    <X size={12} strokeWidth={2} />
                  </button>
                </div>
              )
            })}
            <button
              onClick={() => setSearchFilters({ ...searchFilters, tags: undefined })}
              className="text-[13px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Premium Selection Actions */}
        {selectedNoteIds.size > 0 && (
          <div className="flex items-center justify-between bg-[var(--accent-primary-light)] border border-[var(--accent-primary-border)] rounded-lg px-4 py-3 shadow-[var(--shadow-sm)] mt-6">
            <span className="text-[13px] font-semibold text-[var(--accent-primary)]">
              {selectedNoteIds.size} selected
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={selectAll}
                className="text-[13px] text-[var(--accent-primary)] hover:text-[var(--accent-primary-hover)] font-medium transition-colors"
              >
                Select all
              </button>
              <button
                onClick={clearSelection}
                className="text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-[13px] text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* New Note Input */}
        {isCreatingNote ? (
          <div className="flex items-center gap-3 mt-6">
            <input
              type="text"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleCreateNote()
              }}
              onBlur={() => {
                if (!newNoteTitle.trim()) setIsCreatingNote(false)
              }}
              placeholder="Note title..."
              className="input-apple flex-1"
              autoFocus
            />
            <button
              onClick={handleCreateNote}
              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200 active:scale-[0.98]"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => {
                setIsCreatingNote(false)
                setNewNoteTitle('')
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-[0.98] text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingNote(true)}
            className="btn-apple-ghost w-full flex items-center gap-3 px-4 py-3 mt-6"
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
            <FileText size={48} className="text-gray-400 mb-6" />
            <h3 className="text-apple-title-sm mb-2">No notes yet</h3>
            <p className="text-apple-body-secondary">
              Create your first note to get started
            </p>
          </div>
        ) : (
          <>
            {viewMode.type === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 p-4">
                {sortedNotes.map((note, index) => (
                  <GridViewItem key={note.id} note={note} index={index} />
                ))}
              </div>
            ) : viewMode.type === 'compact' ? (
              <div>
                {sortedNotes.map((note, index) => (
                  <CompactViewItem key={note.id} note={note} index={index} />
                ))}
              </div>
            ) : (
              <div className="space-y-2 p-4">
                {sortedNotes.map((note) => (
                  <MemoizedNoteCard
                    key={note.id}
                    note={note}
                    isActive={activeNoteId === note.id}
                    isSelected={selectedNoteIds.has(note.id)}
                    isFavorite={favoriteNoteIds.has(note.id)}
                    hasSelectedNotes={selectedNoteIds.size > 0}
                    onClick={() => setActiveNote(note.id)}
                    onToggleSelection={() => toggleNoteSelection(note.id)}
                    onToggleFavorite={() => toggleFavorite(note.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 