import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { useStore } from '../store/useStore'

export const BreadcrumbNav: React.FC = () => {
  const {
    activeProjectId,
    activeFolderId,
    activeNoteId,
    projects,
    folders,
    notes,
    setActiveProject,
    setActiveFolder,
    setActiveNote,
  } = useStore()

  const activeProject = projects.find(p => p.id === activeProjectId)
  const activeFolder = folders.find(f => f.id === activeFolderId)
  const activeNote = notes.find(n => n.id === activeNoteId)

  const breadcrumbs = []

  // Only show home if we have other breadcrumbs
  const hasPath = activeProject || activeFolder || activeNote
  
  if (hasPath) {
    breadcrumbs.push({
      id: 'home',
      name: 'Home',
      icon: <Home size={14} />,
      onClick: () => {
        setActiveProject(null)
        setActiveFolder(null)
        setActiveNote(null)
      }
    })
  }

  // Project
  if (activeProject) {
    breadcrumbs.push({
      id: activeProject.id,
      name: activeProject.name,
      onClick: () => {
        setActiveProject(activeProject.id)
        setActiveFolder(null)
        setActiveNote(null)
      }
    })
  }

  // Folder hierarchy
  if (activeFolder) {
    // Build folder path
    const folderPath = []
    let currentFolder: typeof activeFolder | undefined = activeFolder
    
    while (currentFolder) {
      folderPath.unshift(currentFolder)
      currentFolder = folders.find(f => f.id === currentFolder?.parentId)
    }

    folderPath.forEach(folder => {
      breadcrumbs.push({
        id: folder.id,
        name: folder.name,
        onClick: () => {
          setActiveFolder(folder.id)
          setActiveNote(null)
        }
      })
    })
  }

  // Note
  if (activeNote) {
    breadcrumbs.push({
      id: activeNote.id,
      name: activeNote.title,
      onClick: () => setActiveNote(activeNote.id)
    })
  }

  if (breadcrumbs.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-[#D2D2D7] overflow-x-auto">
      {breadcrumbs.map((crumb, index) => (
        <div
          key={crumb.id}
          className="flex items-center gap-2"
        >
          <button
            onClick={crumb.onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[15px]
                     transition-all duration-200 hover:bg-[#F5F5F7] active:scale-[0.98] ${
                       index === breadcrumbs.length - 1
                         ? 'text-[#1D1D1F] font-medium'
                         : 'text-[#86868B] hover:text-[#1D1D1F]'
                     }`}
          >
            {crumb.icon && (
              <span className="text-base">{crumb.icon}</span>
            )}
            <span className="max-w-[150px] truncate">{crumb.name}</span>
          </button>
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 flex-shrink-0 text-[#86868B]" />
          )}
        </div>
      ))}
    </div>
  )
} 