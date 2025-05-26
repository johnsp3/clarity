import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { 
  Plus, FolderOpen, Folder, FileText, ChevronRight,
  Star, Code, Image, Clock, Search, Edit3, Trash2, MoreVertical
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as ContextMenu from '@radix-ui/react-context-menu'
import { useStore } from '../store/useStore'
import { ProjectModal } from './ProjectModal'
import { SettingsPanel } from './SettingsPanel'
import { Folder as FolderType } from '../types/editor'
// @ts-expect-error - JavaScript module
import { auth } from '../services/firebase.js'

export const EnhancedSidebar: React.FC = () => {
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
    setCommandPaletteOpen,
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    if (result.type === 'project') {
      reorderProjects(result.source.index, result.destination.index)
    }
  }

  const handleRenameFolder = (folder: FolderType) => {
    setEditingFolderId(folder.id)
    setEditingFolderName(folder.name)
  }

  const handleSaveRename = () => {
    if (editingFolderId && editingFolderName.trim()) {
      updateFolder(editingFolderId, { name: editingFolderName.trim() })
      setEditingFolderId(null)
      setEditingFolderName('')
    }
  }

  const handleDeleteFolder = (folder: FolderType) => {
    const folderNotes = getNotesByFolder(folder.id)
    const message = folderNotes.length > 0
      ? `Delete "${folder.name}"? This will not delete the ${folderNotes.length} note(s) inside.`
      : `Delete "${folder.name}"?`
    
    if (confirm(message)) {
      deleteFolder(folder.id)
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

  const handleSignOut = () => {
    window.location.reload();
  };

  const handleResetApp = () => {
    window.location.href = '/?reset=true';
  };

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
              <div className="flex items-center gap-2 px-2 py-1">
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
                  className="flex-1 px-2 py-0.5 text-sm bg-white rounded
                           border border-gray-200 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => {
                  toggleFolderExpansion(folder.id)
                  setActiveFolder(folder.id)
                }}
                className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm
                          transition-colors duration-150 group ${
                            activeFolderId === folder.id 
                              ? 'bg-gray-100 border-l-2 border-l-blue-500 font-medium' 
                              : 'hover:bg-gray-50'
                          }`}
              >
                <ChevronRight 
                  size={12} 
                  className={`flex-shrink-0 text-gray-400 transition-transform duration-150 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
                
                {isExpanded ? (
                  <FolderOpen size={14} className="flex-shrink-0 text-gray-600" />
                ) : (
                  <Folder size={14} className="flex-shrink-0 text-gray-600" />
                )}
                
                <span className="flex-1 text-left truncate text-gray-900">{folder.name}</span>
                
                {folderNotes.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {folderNotes.length}
                  </span>
                )}

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-0.5 
                               hover:bg-gray-100 rounded"
                    >
                      <MoreVertical size={14} className="text-gray-400" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="min-w-[160px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item 
                        onClick={() => handleRenameFolder(folder)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <Edit3 size={14} className="text-gray-600" />
                        Rename
                      </DropdownMenu.Item>
                      <DropdownMenu.Item 
                        onClick={() => handleCreateSubfolder(folder)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <Plus size={14} className="text-gray-600" />
                        New Subfolder
                      </DropdownMenu.Item>
                      <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                      <DropdownMenu.Item 
                        onClick={() => handleDeleteFolder(folder)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer text-red-600"
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
              <div className="mt-0.5">
                {folderNotes.map((note) => (
                  <ContextMenu.Root key={note.id}>
                    <ContextMenu.Trigger asChild>
                      <button
                        onClick={() => setActiveNote(note.id)}
                        style={{ paddingLeft: `${(level + 1) * 12}px` }}
                        className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm
                                  transition-colors duration-150 ${
                                    activeNoteId === note.id 
                                      ? 'bg-gray-100 border-l-2 border-l-blue-500 font-medium text-gray-900' 
                                      : 'text-gray-700 hover:bg-gray-50'
                                  }`}
                      >
                        <FileText size={14} className="flex-shrink-0 text-gray-400" />
                        <span className="flex-1 text-left truncate">{note.title}</span>
                        {note.hasImages && <Image size={12} className="text-gray-400" />}
                        {note.hasCode && <Code size={12} className="text-gray-400" />}
                      </button>
                    </ContextMenu.Trigger>
                    
                    <ContextMenu.Portal>
                      <ContextMenu.Content
                        className="min-w-[180px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
                      >
                        <ContextMenu.Item 
                          onClick={() => handleDeleteNote(note.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer text-red-600"
                        >
                          <Trash2 size={14} />
                          Delete
                          <span className="ml-auto text-xs">⌘⌫</span>
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
            className="min-w-[180px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
          >
            <ContextMenu.Item 
              onClick={() => handleRenameFolder(folder)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
            >
              <Edit3 size={14} className="text-gray-600" />
              Rename
              <span className="ml-auto text-xs text-gray-500">⌘R</span>
            </ContextMenu.Item>
            <ContextMenu.Item 
              onClick={() => handleCreateSubfolder(folder)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
            >
              <Plus size={14} className="text-gray-600" />
              New Subfolder
            </ContextMenu.Item>
            <ContextMenu.Separator className="h-px bg-gray-200 my-1" />
            <ContextMenu.Item 
              onClick={() => handleDeleteFolder(folder)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer text-red-600"
            >
              <Trash2 size={14} />
              Delete
              <span className="ml-auto text-xs">⌘⌫</span>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
    )
  }

  return (
    <>
      <aside className="w-60 h-full bg-[#FAFAFA] border-r border-[#E5E5E7] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E5E7]">
          <h1 className="text-lg font-semibold text-gray-900 mb-3">Clarity</h1>
          
          {/* Search */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-white
                     rounded-md border border-[#E5E5E7] hover:border-[#D1D1D3]
                     transition-colors duration-150"
          >
            <Search size={14} className="text-gray-400" />
            <span className="flex-1 text-left text-sm text-gray-600">Search</span>
            <span className="text-xs text-gray-400">⌘K</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* Quick Access */}
          <div className="px-3 mb-4">
            <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Quick Access
            </h2>
            
            <button
              onClick={() => {
                setActiveProject(null)
                setActiveFolder(null)
                setQuickAccessView('all')
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm
                        transition-colors duration-150 ${
                          activeProjectId === null && activeFolderId === null && quickAccessView === 'all'
                            ? 'bg-gray-100 font-medium text-gray-900'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
            >
              <FileText size={14} className="text-gray-600" />
              <span className="flex-1 text-left">All Notes</span>
              <span className="text-xs text-gray-500">
                {notes.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveProject(null)
                setActiveFolder(null)
                setQuickAccessView('recent')
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm
                       transition-colors duration-150 ${
                         activeProjectId === null && activeFolderId === null && quickAccessView === 'recent'
                           ? 'bg-gray-100 font-medium text-gray-900'
                           : 'text-gray-700 hover:bg-gray-50'
                       }`}
            >
              <Clock size={14} className="text-gray-600" />
              <span className="flex-1 text-left">Recent</span>
              <span className="text-xs text-gray-500">
                {recentNotes().length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveProject(null)
                setActiveFolder(null)
                setQuickAccessView('favorites')
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm
                       transition-colors duration-150 ${
                         activeProjectId === null && activeFolderId === null && quickAccessView === 'favorites'
                           ? 'bg-gray-100 font-medium text-gray-900'
                           : 'text-gray-700 hover:bg-gray-50'
                       }`}
            >
              <Star size={14} className="text-gray-600" />
              <span className="flex-1 text-left">Favorites</span>
              <span className="text-xs text-gray-500">
                {favoriteNotes().length}
              </span>
            </button>
          </div>

          {/* Projects Section */}
          <div className="px-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Projects
              </h2>
              <button
                onClick={() => setShowProjectModal(true)}
                className="p-1 hover:bg-gray-100 rounded transition-colors duration-150"
              >
                <Plus size={14} className="text-gray-600" />
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
                                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm
                                            transition-colors duration-150 group ${
                                              activeProjectId === project.id
                                                ? 'bg-gray-100 border-l-2 border-l-blue-500 font-medium'
                                                : 'hover:bg-gray-50'
                                            }`}
                                >
                                  <ChevronRight 
                                    size={12} 
                                    className={`flex-shrink-0 text-gray-400 transition-transform duration-150 ${
                                      isExpanded ? 'rotate-90' : ''
                                    }`}
                                  />
                                  
                                  {/* Project Color Indicator */}
                                  {project.color && (
                                    <div 
                                      className={`w-3 h-3 rounded-full bg-gradient-to-br ${project.color} flex-shrink-0`}
                                      title={`Project color: ${project.color}`}
                                    />
                                  )}
                                  
                                  {/* Project Icon */}
                                  {project.icon && (
                                    <span className="flex-shrink-0 text-sm">{project.icon}</span>
                                  )}
                                  
                                  <span className="flex-1 text-left text-gray-900">{project.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {noteCount}
                                  </span>
                                  
                                  <DropdownMenu.Root>
                                    <DropdownMenu.Trigger asChild>
                                      <button
                                        onClick={(e) => e.stopPropagation()}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-0.5 
                                                 hover:bg-gray-100 rounded"
                                      >
                                        <MoreVertical size={14} className="text-gray-400" />
                                      </button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Portal>
                                      <DropdownMenu.Content
                                        className="min-w-[160px] bg-white rounded-md shadow-md p-1 z-50 border border-gray-200"
                                        sideOffset={5}
                                      >
                                        <DropdownMenu.Item 
                                          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer"
                                        >
                                          <Edit3 size={14} className="text-gray-600" />
                                          Rename
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />
                                        <DropdownMenu.Item 
                                          onClick={() => handleDeleteProject(project.id)}
                                          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded hover:bg-gray-50 cursor-pointer text-red-600"
                                        >
                                          <Trash2 size={14} />
                                          Delete
                                        </DropdownMenu.Item>
                                      </DropdownMenu.Content>
                                    </DropdownMenu.Portal>
                                  </DropdownMenu.Root>
                                </button>

                                {/* Project folders and content */}
                                {isExpanded && (
                                  <div className="mt-0.5">
                                    {projectFolders.map((folder) => renderFolder(folder))}
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
        </nav>

        {/* Bottom Action */}
        <div className="p-3 border-t border-[#E5E5E7]">
          <SettingsPanel 
            userEmail={auth?.currentUser?.email || ''}
            onSignOut={handleSignOut}
            onResetApp={handleResetApp}
          />
        </div>
      </aside>

      {/* Modals */}
      {showProjectModal && (
        <ProjectModal 
          open={showProjectModal}
          onOpenChange={setShowProjectModal}
        />
      )}
    </>
  )
} 