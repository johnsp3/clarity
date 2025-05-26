import React, { useState } from 'react'
import { 
  Plus, Grid, List as ListIcon, AlignLeft, SortDesc,
  Calendar, Edit2, Star, Check, X,
  FileText, Image, Code, Trash2, FolderInput,
  Share2, Archive, Tag, MoreVertical
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Checkbox from '@radix-ui/react-checkbox'
import { useStore } from '../store/useStore'
import { Note } from '../store/useStore'
import { BreadcrumbNav } from './BreadcrumbNav'

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
    deleteNote,
    setViewMode,
    addNote,
    favoriteNoteIds,
    toggleFavorite,
    activeFolderId,
  } = useStore()

  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [newNoteTitle, setNewNoteTitle] = useState('')

  const sortedNotes = filteredNotes()

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
      })
      setNewNoteTitle('')
      setIsCreatingNote(false)
    }
  }

  const handleBulkDelete = () => {
    if (selectedNoteIds.size > 0) {
      deleteNotes(Array.from(selectedNoteIds))
      clearSelection()
    }
  }

  const handleDeleteNote = (noteId: string) => {
    const note = sortedNotes.find(n => n.id === noteId)
    if (!note) return

    if (confirm(`Delete "${note.title}"? This action cannot be undone.`)) {
      deleteNote(noteId)
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

  // List View Item
  const ListViewItem: React.FC<{ note: Note; index: number }> = ({ note }) => {
    const isSelected = selectedNoteIds.has(note.id)
    const isActive = activeNoteId === note.id
    const isFavorite = favoriteNoteIds.has(note.id)

    return (
      <div
        className={`note-card group ${
          isActive ? 'note-card-active' : ''
        }`}
        onClick={() => setActiveNote(note.id)}
      >
        <div className="flex items-start gap-4">
          {/* Checkbox */}
          <Checkbox.Root
            checked={isSelected}
            onCheckedChange={() => toggleNoteSelection(note.id)}
            onClick={(e) => e.stopPropagation()}
            className={`w-4 h-4 rounded border border-[#D2D2D7] bg-white mt-1
                     hover:border-[#007AFF] focus:outline-none transition-opacity duration-200 ${
                       selectedNoteIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                     }`}
          >
            <Checkbox.Indicator>
              <Check className="w-3 h-3 text-[#007AFF]" strokeWidth={2} />
            </Checkbox.Indicator>
          </Checkbox.Root>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className={`text-[15px] truncate ${
                isActive ? 'font-medium text-[#1D1D1F]' : 'font-normal text-[#1D1D1F]'
              }`}>
                {note.title}
              </h3>
              
              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(note.id)
                  }}
                  className={`p-1 rounded-md hover:bg-[#F5F5F7] transition-all duration-200 active:scale-[0.98] ${
                    isFavorite ? 'text-yellow-500' : 'text-[#86868B]'
                  }`}
                >
                  <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded hover:bg-[#F5F5F7]"
                    >
                      <MoreVertical size={14} className="text-[#86868B]" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="dropdown-apple min-w-[160px] z-apple-dropdown"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item className="dropdown-item-apple">
                        <Share2 size={14} className="text-[#86868B]" />
                        Share
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="dropdown-item-apple">
                        <FolderInput size={14} className="text-[#86868B]" />
                        Move to...
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="dropdown-item-apple">
                        <Archive size={14} className="text-[#86868B]" />
                        Archive
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="divider-apple my-1" />
                      <DropdownMenu.Item 
                        onClick={() => handleDeleteNote(note.id)}
                        className="dropdown-item-apple text-red-600"
                      >
                        <Trash2 size={14} />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
            
            <p className="text-apple-caption mt-2 line-clamp-2">
              {note.content || 'No content yet...'}
            </p>
            
            <div className="flex items-center gap-4 mt-3">
              <span className="text-apple-caption">
                {formatDate(note.updatedAt)}
              </span>
              {note.hasImages && (
                <span className="flex items-center gap-1 text-apple-caption">
                  <Image size={12} />
                  Images
                </span>
              )}
              {note.hasCode && (
                <span className="flex items-center gap-1 text-apple-caption">
                  <Code size={12} />
                  Code
                </span>
              )}
              {note.tags.length > 0 && (
                <span className="flex items-center gap-1 text-apple-caption">
                  <Tag size={12} />
                  {note.tags.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid View Item
  const GridViewItem: React.FC<{ note: Note; index: number }> = ({ note }) => {
    const isSelected = selectedNoteIds.has(note.id)
    const isActive = activeNoteId === note.id
    const isFavorite = favoriteNoteIds.has(note.id)

    return (
      <div
        className={`group p-4 rounded-lg bg-white border cursor-pointer
                  transition-all duration-200 ${
                    isActive
                      ? 'border-[#007AFF] shadow-sm'
                      : 'border-[#D2D2D7] hover:border-[#86868B] hover:shadow-sm'
                  }`}
        onClick={() => setActiveNote(note.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`text-[15px] line-clamp-2 ${
            isActive ? 'font-medium text-[#1D1D1F]' : 'font-normal text-[#1D1D1F]'
          }`}>
            {note.title}
          </h3>
          
          <Checkbox.Root
            checked={isSelected}
            onCheckedChange={() => toggleNoteSelection(note.id)}
            onClick={(e) => e.stopPropagation()}
            className={`w-4 h-4 rounded border border-[#D2D2D7] bg-white flex-shrink-0
                     hover:border-[#007AFF] focus:outline-none transition-opacity duration-200 ${
                       selectedNoteIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                     }`}
          >
            <Checkbox.Indicator>
              <Check className="w-3 h-3 text-[#007AFF]" strokeWidth={2} />
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>

        {/* Content preview */}
        <p className="text-[13px] text-[#86868B] line-clamp-3 mb-3">
          {note.content || 'No content yet...'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-[#86868B]">
            {formatDate(note.updatedAt)}
          </span>
          
          <div className="flex items-center gap-2">
            {note.hasImages && <Image size={12} className="text-[#86868B]" />}
            {note.hasCode && <Code size={12} className="text-[#86868B]" />}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(note.id)
              }}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                isFavorite ? 'text-yellow-600 opacity-100' : 'text-[#86868B]'
              }`}
            >
              <Star size={12} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
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
        className={`group px-4 py-2 border-b border-[#D2D2D7] cursor-pointer
                  transition-colors duration-200 ${
                    isActive
                      ? 'bg-[#F5F5F7] border-l-2 border-l-[#007AFF]'
                      : 'hover:bg-[#F5F5F7]'
                  }`}
        onClick={() => setActiveNote(note.id)}
      >
        <div className="flex items-center gap-3">
          <Checkbox.Root
            checked={isSelected}
            onCheckedChange={() => toggleNoteSelection(note.id)}
            onClick={(e) => e.stopPropagation()}
            className={`w-4 h-4 rounded border border-[#D2D2D7] bg-white
                     hover:border-[#007AFF] focus:outline-none transition-opacity duration-200 ${
                       selectedNoteIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                     }`}
          >
            <Checkbox.Indicator>
              <Check className="w-3 h-3 text-[#007AFF]" strokeWidth={2} />
            </Checkbox.Indicator>
          </Checkbox.Root>

          <FileText size={14} className="text-[#86868B] flex-shrink-0" />
          
          <span className={`flex-1 truncate text-[15px] ${
            isActive ? 'font-medium text-[#1D1D1F]' : 'text-[#1D1D1F]'
          }`}>
            {note.title}
          </span>
          
          <div className="flex items-center gap-2 text-[13px] text-[#86868B]">
            {note.hasImages && <Image size={12} />}
            {note.hasCode && <Code size={12} />}
            <span>{formatDate(note.updatedAt)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(note.id)
              }}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                isFavorite ? 'text-yellow-600 opacity-100' : 'text-[#86868B]'
              }`}
            >
              <Star size={12} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 flex flex-col h-full bg-white border-r border-[#D2D2D7]">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav />
      
      {/* Header */}
      <div className="border-b border-[#D2D2D7] p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            {activeProjectId ? (
              <>
                <h2 className="text-apple-title-sm">
                  {projects.find(p => p.id === activeProjectId)?.name}
                </h2>
                <p className="text-apple-caption mt-1">
                  {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}
                </p>
              </>
            ) : (
              <p className="text-[15px] font-medium text-[#1D1D1F]">
                {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}
              </p>
            )}
          </div>

          {/* View Options */}
          <div className="flex items-center gap-2">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="btn-apple-ghost text-[13px] px-3 py-2">
                  <SortDesc size={14} className={viewMode.sortOrder === 'asc' ? 'rotate-180' : ''} />
                  Sort
                  <span className="text-[11px] text-[#86868B] ml-1">
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
                    <Calendar size={16} className="text-[#86868B]" />
                    Last Modified
                    {viewMode.sortBy === 'modified' && <Check size={16} className="ml-auto text-[#007AFF]" />}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ ...viewMode, sortBy: 'created' })}
                    className="dropdown-item-apple"
                  >
                    <Calendar size={16} className="text-[#86868B]" />
                    Date Created
                    {viewMode.sortBy === 'created' && <Check size={16} className="ml-auto text-[#007AFF]" />}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ ...viewMode, sortBy: 'title' })}
                    className="dropdown-item-apple"
                  >
                    <Edit2 size={16} className="text-[#86868B]" />
                    Title
                    {viewMode.sortBy === 'title' && <Check size={16} className="ml-auto text-[#007AFF]" />}
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
                        <SortDesc size={16} className="text-[#86868B]" />
                        Sort Descending
                      </>
                    ) : (
                      <>
                        <SortDesc size={16} className="text-[#86868B] rotate-180" />
                        Sort Ascending
                      </>
                    )}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <div className="flex items-center bg-[#F5F5F7] rounded-lg p-1">
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'list' })}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode.type === 'list' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-white hover:bg-opacity-50'
                }`}
              >
                <ListIcon size={16} />
              </button>
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'grid' })}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode.type === 'grid' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-white hover:bg-opacity-50'
                }`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'compact' })}
                className={`p-2 rounded-md transition-all duration-200 ${
                  viewMode.type === 'compact' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-white hover:bg-opacity-50'
                }`}
              >
                <AlignLeft size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedNoteIds.size > 0 && (
          <div className="flex items-center justify-between bg-[rgba(0,122,255,0.1)] rounded-lg px-4 py-3">
            <span className="text-[13px] font-medium text-[#007AFF]">
              {selectedNoteIds.size} selected
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={selectAll}
                className="text-[13px] text-[#007AFF] hover:underline"
              >
                Select all
              </button>
              <button
                onClick={clearSelection}
                className="text-[13px] text-[#86868B] hover:underline"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-[13px] text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* New Note Input */}
        {isCreatingNote ? (
          <div className="flex items-center gap-3 mt-4">
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
              className="p-2 text-[#007AFF] hover:bg-[rgba(0,122,255,0.1)] rounded-lg transition-all duration-200 active:scale-[0.98]"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => {
                setIsCreatingNote(false)
                setNewNoteTitle('')
              }}
              className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-all duration-200 active:scale-[0.98] text-[#86868B]"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingNote(true)}
            className="btn-apple-ghost w-full flex items-center gap-3 px-4 py-3 mt-4"
          >
            <Plus size={18} />
            <span>New Note</span>
          </button>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
            <FileText size={48} className="text-[#86868B] mb-6" />
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
              <div>
                {sortedNotes.map((note, index) => (
                  <ListViewItem key={note.id} note={note} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 