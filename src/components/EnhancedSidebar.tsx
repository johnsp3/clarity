import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { 
  Plus, FolderOpen, Folder, FileText, ChevronRight,
  Star, Code, Image, Clock, Edit3, Trash2, MoreVertical, Sparkles
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { useStore } from '../store/useStore'
import { ProjectModal } from './ProjectModal'
import { UserProfile } from './UserProfile'

import { Folder as FolderType } from '../types/editor'

interface EnhancedSidebarProps {
  onShowSearch: () => void
  userEmail: string
  onSignOut: () => void
}

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({ 
  onShowSearch, 
  userEmail, 
  onSignOut 
}) => {
  const {
    projects,
    folders,
    notes,
    activeProjectId,
    activeFolderId,
    activeNoteId,
    expandedFolders,
    quickAccessView,
    setActiveProject,
    setActiveFolder,
    setActiveNote,
    toggleFolderExpansion,
    reorderProjects,
    getProjectNoteCount,
    getFoldersByProject,
    getNotesByFolder,

    setQuickAccessView,
    recentNotes,
    favoriteNotes,
    updateFolder,
    deleteFolder,
    addFolder,
    deleteProject,
    deleteNote,
  } = useStore()

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editingFolderName, setEditingFolderName] = useState('')

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    if (result.type === 'project') {
      try {
        await reorderProjects(result.source.index, result.destination.index)
      } catch (error) {
        console.error('Failed to reorder projects:', error)
      }
    }
  }

  const handleRenameFolder = (folder: FolderType) => {
    setEditingFolderId(folder.id)
    setEditingFolderName(folder.name)
  }

  const handleSaveRename = async () => {
    if (editingFolderId && editingFolderName.trim()) {
      try {
        await updateFolder(editingFolderId, { name: editingFolderName.trim() })
        setEditingFolderId(null)
        setEditingFolderName('')
      } catch (error) {
        console.error('Failed to rename folder:', error)
      }
    }
  }

  const handleDeleteFolder = async (folder: FolderType) => {
    const folderNotes = getNotesByFolder(folder.id)
    const message = folderNotes.length > 0
      ? `Delete "${folder.name}"? This will not delete the ${folderNotes.length} note(s) inside.`
      : `Delete "${folder.name}"?`
    
    if (confirm(message)) {
      try {
        await deleteFolder(folder.id)
      } catch (error) {
        console.error('Failed to delete folder:', error)
      }
    }
  }

  const handleCreateSubfolder = (parentFolder: FolderType) => {
    const name = prompt('Enter folder name:')
    if (name?.trim()) {
      addFolder({
        name: name.trim(),
        projectId: parentFolder.projectId,
        parentId: parentFolder.id,
      })
    }
  }

  const handleDeleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    const noteCount = getProjectNoteCount(projectId)
    const message = noteCount > 0
      ? `Delete "${project.name}"? This will unassign ${noteCount} note(s) from this project.`
      : `Delete "${project.name}"?`
    
    if (confirm(message)) {
      deleteProject(projectId)
    }
  }

  const handleDeleteNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (!note) return

    if (confirm(`Delete "${note.title}"? This action cannot be undone.`)) {
      deleteNote(noteId)
    }
  }



  const renderFolder = (folder: FolderType, level: number = 1) => {
    const childFolders = folders.filter(f => f.parentId === folder.id)
    const folderNotes = getNotesByFolder(folder.id)
    const isExpanded = expandedFolders.has(folder.id)
    const isEditing = editingFolderId === folder.id

    return (
      <ContextMenu.Root key={folder.id}>
        <ContextMenu.Trigger asChild>
          <div style={{ paddingLeft: `${level * 12}px` }}>
            {isEditing ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <input
                  type="text"
                  value={editingFolderName}
                  onChange={(e) => setEditingFolderName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleSaveRename()
                    if (e.key === 'Escape') {
                      setEditingFolderId(null)
                      setEditingFolderName('')
                    }
                  }}
                  onBlur={handleSaveRename}
                  className="input-apple flex-1 text-[15px] py-1"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  toggleFolderExpansion(folder.id)
                  setActiveFolder(folder.id)
                }}
                className={`sidebar-item w-full ${
                  activeFolderId === folder.id 
                    ? 'sidebar-item-active' 
                    : ''
                }`}
              >
                <ChevronRight 
                  size={12} 
                  className={`flex-shrink-0 text-[var(--text-tertiary)] transition-transform var(--transition-fast) ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
                
                {isExpanded ? (
                  <FolderOpen size={16} className="flex-shrink-0 text-[var(--text-secondary)]" />
                ) : (
                  <Folder size={16} className="flex-shrink-0 text-[var(--text-secondary)]" />
                )}
                
                <span className="flex-1 text-left truncate">{folder.name}</span>
                
                {folderNotes.length > 0 && (
                  <span className="text-[13px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full font-medium">
                    {folderNotes.length}
                  </span>
                )}

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 
                               hover:bg-gray-100 rounded"
                    >
                      <MoreVertical size={14} className="text-gray-500" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="dropdown-apple min-w-[160px] z-apple-dropdown"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item 
                        onClick={() => handleRenameFolder(folder)}
                        className="dropdown-item-apple"
                      >
                        <Edit3 size={14} className="text-gray-500" />
                        Rename
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        onClick={() => handleCreateSubfolder(folder)}
                        className="dropdown-item-apple"
                      >
                        <Plus size={14} className="text-gray-500" />
                        New Subfolder
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="divider-apple my-1" />
                      <DropdownMenu.Item 
                        onClick={() => handleDeleteFolder(folder)}
                        className="dropdown-item-apple text-red-600"
                      >
                        <Trash2 size={14} />
                        Delete
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </button>
            )}

            {/* Render notes in this folder */}
            {isExpanded && (
              <div className="mt-1">
                {folderNotes.map((note) => (
                  <ContextMenu.Root key={note.id}>
                    <ContextMenu.Trigger asChild>
                      <button
                        onClick={() => setActiveNote(note.id)}
                        style={{ paddingLeft: `${(level + 1) * 12}px` }}
                        className={`sidebar-item w-full ${
                          activeNoteId === note.id 
                            ? 'sidebar-item-active' 
                            : ''
                        }`}
                      >
                        <FileText size={16} className="flex-shrink-0 text-[var(--text-secondary)]" />
                        <span className="flex-1 text-left truncate">{note.title}</span>
                        {note.hasImages && <Image size={12} className="text-[var(--text-tertiary)]" />}
                        {note.hasCode && <Code size={12} className="text-[var(--text-tertiary)]" />}
                      </button>
                    </ContextMenu.Trigger>
                    
                    <ContextMenu.Portal>
                      <ContextMenu.Content
                        className="dropdown-apple min-w-[180px] z-apple-dropdown"
                      >
                        <ContextMenu.Item 
                          onClick={() => handleDeleteNote(note.id)}
                          className="dropdown-item-apple text-red-600"
                        >
                          <Trash2 size={14} />
                          Delete
                          <span className="ml-auto text-[13px]">⌘⌫</span>
                        </ContextMenu.Item>
                      </ContextMenu.Content>
                    </ContextMenu.Portal>
                  </ContextMenu.Root>
                ))}
                
                {/* Render child folders */}
                {childFolders.map((childFolder) => renderFolder(childFolder, level + 1))}
              </div>
            )}
          </div>
        </ContextMenu.Trigger>

        <ContextMenu.Portal>
          <ContextMenu.Content
            className="dropdown-apple min-w-[180px] z-apple-dropdown"
          >
            <ContextMenu.Item 
              onClick={() => handleRenameFolder(folder)}
              className="dropdown-item-apple"
            >
              <Edit3 size={14} className="text-gray-500" />
              Rename
              <span className="ml-auto text-[13px] text-gray-500">⌘R</span>
            </ContextMenu.Item>
            <ContextMenu.Item 
              onClick={() => handleCreateSubfolder(folder)}
              className="dropdown-item-apple"
            >
              <Plus size={14} className="text-gray-500" />
              New Subfolder
            </ContextMenu.Item>
            <ContextMenu.Separator className="divider-apple my-1" />
            <ContextMenu.Item 
              onClick={() => handleDeleteFolder(folder)}
              className="dropdown-item-apple text-red-600"
            >
              <Trash2 size={14} />
              Delete
              <span className="ml-auto text-[13px]">⌘⌫</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    )
  }

  return (
    <>
      <aside className="w-[260px] h-screen bg-[var(--bg-primary)] border-r border-[var(--border-light)] flex flex-col shadow-[var(--shadow-xs)] overflow-hidden">
        {/* Library Section */}
        <div className="p-6 flex-shrink-0">
          <h2 className="text-apple-footnote mb-6">
            LIBRARY
          </h2>
          
          <div className="space-y-1">
            <button
              onClick={() => {
                setActiveProject(null)
                setActiveFolder(null)
                setQuickAccessView('all')
              }}
              className={`sidebar-item w-full ${
                activeProjectId === null && activeFolderId === null && quickAccessView === 'all'
                  ? 'sidebar-item-active'
                  : ''
              }`}
            >
              <FileText size={16} className="text-[var(--text-secondary)]" />
              <span className="flex-1 text-left">All Notes</span>
              <span className="text-[13px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full font-medium">
                {notes.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveProject(null)
                setActiveFolder(null)
                setQuickAccessView('recent')
              }}
              className={`sidebar-item w-full ${
                activeProjectId === null && activeFolderId === null && quickAccessView === 'recent'
                  ? 'sidebar-item-active'
                  : ''
              }`}
            >
              <Clock size={16} className="text-[var(--text-secondary)]" />
              <span className="flex-1 text-left">Recent</span>
              <span className="text-[13px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full font-medium">
                {recentNotes().length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveProject(null)
                setActiveFolder(null)
                setQuickAccessView('favorites')
              }}
              className={`sidebar-item w-full ${
                activeProjectId === null && activeFolderId === null && quickAccessView === 'favorites'
                  ? 'sidebar-item-active'
                  : ''
              }`}
            >
              <Star size={16} className="text-[var(--text-secondary)]" />
              <span className="flex-1 text-left">Favorites</span>
              <span className="text-[13px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full font-medium">
                {favoriteNotes().length}
              </span>
            </button>

            {/* Premium AI Search */}
            <button
              onClick={onShowSearch}
              className="sidebar-item w-full group"
            >
              <Sparkles size={16} className="text-[var(--accent-primary)] group-hover:text-[var(--accent-primary-hover)]" />
              <span className="flex-1 text-left">AI Search</span>
              <span className="text-[10px] text-[var(--accent-primary)] bg-[var(--accent-primary-light)] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wide">
                PRO
              </span>
            </button>
          </div>
        </div>

        <div className="divider-apple flex-shrink-0" />

        {/* Collections Section */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-apple-footnote">
              COLLECTIONS
            </h2>
            <button
              onClick={() => setShowProjectModal(true)}
              className="btn-apple-icon hover-lift"
              title="Create new collection"
            >
              <Plus size={16} className="text-[var(--text-secondary)]" />
            </button>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="projects" type="project">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-1"
                >
                  {projects.map((project, index) => {
                    const projectFolders = getFoldersByProject(project.id)
                    const noteCount = getProjectNoteCount(project.id)
                    const isExpanded = expandedFolders.has(project.id)

                    return (
                      <Draggable
                        key={project.id}
                        draggableId={project.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                          >
                            <div className={snapshot.isDragging ? 'opacity-50' : ''}>
                              <button
                                onClick={() => {
                                  setActiveProject(project.id)
                                  toggleFolderExpansion(project.id)
                                }}
                                className={`sidebar-item w-full group ${
                                  activeProjectId === project.id
                                    ? 'sidebar-item-active'
                                    : ''
                                }`}
                              >
                                <ChevronRight 
                                  size={12} 
                                  className={`flex-shrink-0 text-[var(--text-tertiary)] transition-transform var(--transition-fast) ${
                                    isExpanded ? 'rotate-90' : ''
                                  }`}
                                />
                                
                                <span className="flex-1 text-left">{project.name}</span>
                                <span className="text-[13px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-0.5 rounded-full font-medium">
                                  {noteCount}
                                </span>
                                
                                <DropdownMenu.Root>
                                  <DropdownMenu.Trigger asChild>
                                    <button
                                      onClick={(e) => e.stopPropagation()}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 
                                               hover:bg-gray-100 rounded"
                                    >
                                      <MoreVertical size={14} className="text-gray-500" />
                                    </button>
                                  </DropdownMenu.Trigger>
                                  <DropdownMenu.Portal>
                                    <DropdownMenu.Content
                                      className="dropdown-apple min-w-[160px] z-apple-dropdown"
                                      sideOffset={5}
                                    >
                                      <DropdownMenu.Item 
                                        className="dropdown-item-apple"
                                      >
                                        <Edit3 size={14} className="text-gray-500" />
                                        Rename
                                      </DropdownMenu.Item>
                                      <DropdownMenu.Separator className="divider-apple my-1" />
                                      <DropdownMenu.Item 
                                        onClick={() => handleDeleteProject(project.id)}
                                        className="dropdown-item-apple text-red-600"
                                      >
                                        <Trash2 size={14} />
                                        Delete
                                      </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                  </DropdownMenu.Portal>
                                </DropdownMenu.Root>
                              </button>

                              {/* Render project folders */}
                              {isExpanded && (
                                <div className="mt-1">
                                  {projectFolders
                                    .filter(folder => !folder.parentId)
                                    .map((folder) => renderFolder(folder, 1))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>


        </div>

        {/* User Profile at bottom */}
        <div className="p-6 border-t border-[var(--border-light)] bg-[var(--bg-tertiary)] flex-shrink-0">
          <UserProfile 
            userEmail={userEmail} 
            onSignOut={onSignOut}
          />
        </div>
      </aside>

      {/* Modals */}
      <ProjectModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
      />
    </>
  )
} 