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
        className={`group px-4 py-3 border-b border-[#E5E5E7] cursor-pointer
                  transition-colors duration-150 ${
                    isActive
                      ? 'bg-white border-l-2 border-l-[#0F62FE] hover:bg-white'
                      : 'hover:bg-[#FAFAFA]'
                  }`}
        onClick={() => setActiveNote(note.id)}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <Checkbox.Root
            checked={isSelected}
            onCheckedChange={() => toggleNoteSelection(note.id)}
            onClick={(e) => e.stopPropagation()}
            className={`w-4 h-4 rounded border border-gray-300 bg-white mt-0.5
                     hover:border-[#0F62FE] focus:outline-none transition-opacity duration-150 ${
                       selectedNoteIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                     }`}
          >
            <Checkbox.Indicator>
              <Check className="w-3 h-3 text-[#0F62FE]" strokeWidth={2} />
            </Checkbox.Indicator>
          </Checkbox.Root>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`text-sm truncate ${
                isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'
              }`}>
                {note.title}
              </h3>
              
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(note.id)
                  }}
                  className={`p-1 rounded hover:bg-gray-100 ${
                    isFavorite ? 'text-yellow-600' : 'text-gray-400'
                  }`}
                >
                  <Star size={14} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
                
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded hover:bg-gray-100"
                    >
                      <MoreVertical size={14} className="text-gray-400" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="min-w-[160px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer">
                        <Share2 size={14} className="text-gray-600" />
                        Share
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer">
                        <FolderInput size={14} className="text-gray-600" />
                        Move to...
                      </DropdownMenu.Item>
                      <DropdownMenu.Item className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer">
                        <Archive size={14} className="text-gray-600" />
                        Archive
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item 
                        onClick={() => handleDeleteNote(note.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer text-red-600"
                      >
                        <Trash2 size={14} />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
            
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
              {note.content || 'No content yet...'}
            </p>
            
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-500">
                {formatDate(note.updatedAt)}
              </span>
              {note.hasImages && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Image size={12} />
                  Images
                </span>
              )}
              {note.hasCode && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Code size={12} />
                  Code
                </span>
              )}
              {note.tags.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
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
        className={`group p-4 rounded-md bg-white border cursor-pointer
                  transition-all duration-150 ${
                    isActive
                      ? 'border-[#0F62FE] shadow-sm'
                      : 'border-[#E5E5E7] hover:border-[#D1D1D3] hover:shadow-sm'
                  }`}
        onClick={() => setActiveNote(note.id)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className={`text-sm line-clamp-2 ${
            isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'
          }`}>
            {note.title}
          </h3>
          
          <Checkbox.Root
            checked={isSelected}
            onCheckedChange={() => toggleNoteSelection(note.id)}
            onClick={(e) => e.stopPropagation()}
            className={`w-4 h-4 rounded border border-gray-300 bg-white flex-shrink-0
                     hover:border-[#0F62FE] focus:outline-none transition-opacity duration-150 ${
                       selectedNoteIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                     }`}
          >
            <Checkbox.Indicator>
              <Check className="w-3 h-3 text-[#0F62FE]" strokeWidth={2} />
            </Checkbox.Indicator>
          </Checkbox.Root>
        </div>

        {/* Content preview */}
        <p className="text-xs text-gray-600 line-clamp-3 mb-3">
          {note.content || 'No content yet...'}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {formatDate(note.updatedAt)}
          </span>
          
          <div className="flex items-center gap-2">
            {note.hasImages && <Image size={12} className="text-gray-400" />}
            {note.hasCode && <Code size={12} className="text-gray-400" />}
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(note.id)
              }}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
                isFavorite ? 'text-yellow-600 opacity-100' : 'text-gray-400'
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
        className={`group px-4 py-2 border-b border-[#E5E5E7] cursor-pointer
                  transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#F5F5F5] border-l-2 border-l-[#0F62FE]'
                      : 'hover:bg-[#FAFAFA]'
                  }`}
        onClick={() => setActiveNote(note.id)}
      >
        <div className="flex items-center gap-3">
          <Checkbox.Root
            checked={isSelected}
            onCheckedChange={() => toggleNoteSelection(note.id)}
            onClick={(e) => e.stopPropagation()}
            className={`w-4 h-4 rounded border border-gray-300 bg-white
                     hover:border-[#0F62FE] focus:outline-none transition-opacity duration-150 ${
                       selectedNoteIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                     }`}
          >
            <Checkbox.Indicator>
              <Check className="w-3 h-3 text-[#0F62FE]" strokeWidth={2} />
            </Checkbox.Indicator>
          </Checkbox.Root>

          <FileText size={14} className="text-gray-400 flex-shrink-0" />
          
          <span className={`flex-1 truncate text-sm ${
            isActive ? 'font-medium text-gray-900' : 'text-gray-700'
          }`}>
            {note.title}
          </span>
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {note.hasImages && <Image size={12} />}
            {note.hasCode && <Code size={12} />}
            <span>{formatDate(note.updatedAt)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(note.id)
              }}
              className={`opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
                isFavorite ? 'text-yellow-600 opacity-100' : 'text-gray-400'
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
    <div className="w-80 flex flex-col h-full bg-white border-r border-[#E5E5E7]">
      {/* Breadcrumb Navigation */}
      <BreadcrumbNav />
      
      {/* Header */}
      <div className="border-b border-[#E5E5E7] p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            {activeProjectId ? (
              <>
                <h2 className="text-base font-semibold text-gray-900">
                  {projects.find(p => p.id === activeProjectId)?.name}
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-gray-700">
                {sortedNotes.length} {sortedNotes.length === 1 ? 'note' : 'notes'}
              </p>
            )}
          </div>

          {/* View Options */}
          <div className="flex items-center gap-1">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="btn-ghost text-xs">
                  <SortDesc size={14} />
                  Sort
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[180px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
                  sideOffset={5}
                >
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ ...viewMode, sortBy: 'modified' })}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Calendar size={14} className="text-gray-600" />
                    Last Modified
                    {viewMode.sortBy === 'modified' && <Check size={14} className="ml-auto text-[#0F62FE]" />}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ ...viewMode, sortBy: 'created' })}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Calendar size={14} className="text-gray-600" />
                    Date Created
                    {viewMode.sortBy === 'created' && <Check size={14} className="ml-auto text-[#0F62FE]" />}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item 
                    onClick={() => setViewMode({ ...viewMode, sortBy: 'title' })}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <Edit2 size={14} className="text-gray-600" />
                    Title
                    {viewMode.sortBy === 'title' && <Check size={14} className="ml-auto text-[#0F62FE]" />}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <div className="flex items-center bg-gray-100 rounded p-1">
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'list' })}
                className={`p-1 rounded transition-colors duration-150 ${
                  viewMode.type === 'list' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <ListIcon size={14} />
              </button>
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'grid' })}
                className={`p-1 rounded transition-colors duration-150 ${
                  viewMode.type === 'grid' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode({ ...viewMode, type: 'compact' })}
                className={`p-1 rounded transition-colors duration-150 ${
                  viewMode.type === 'compact' 
                    ? 'bg-white shadow-sm' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <AlignLeft size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedNoteIds.size > 0 && (
          <div className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
            <span className="text-xs font-medium text-[#0F62FE]">
              {selectedNoteIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-xs text-[#0F62FE] hover:underline"
              >
                Select all
              </button>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-600 hover:underline"
              >
                Clear
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* New Note Input */}
        {isCreatingNote ? (
          <div className="flex items-center gap-2 mt-3">
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
              className="flex-1 px-3 py-1.5 text-sm bg-white rounded-md
                       border border-[#E5E5E7] focus:border-[#0F62FE] focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleCreateNote}
              className="p-1.5 text-[#0F62FE] hover:bg-blue-50 rounded"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => {
                setIsCreatingNote(false)
                setNewNoteTitle('')
              }}
              className="p-1.5 text-gray-400 hover:bg-gray-50 rounded"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingNote(true)}
            className="w-full mt-3 px-3 py-2 text-sm text-gray-600 bg-gray-50 
                     hover:bg-gray-100 rounded-md transition-colors duration-150
                     flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            New Note
          </button>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {sortedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
            <FileText size={48} className="text-gray-300 mb-4" />
            <h3 className="text-base font-medium text-gray-900 mb-2">No notes yet</h3>
            <p className="text-sm text-gray-600">
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