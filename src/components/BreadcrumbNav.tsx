import React from 'react'
import { motion } from 'framer-motion'
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
      icon: activeProject.icon,
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
    <div className="flex items-center gap-1 px-4 py-2.5 bg-gradient-to-r from-apple-secondary/30 to-transparent 
                    border-b border-apple-border/50 backdrop-blur-sm
                    overflow-x-auto scrollbar-hide">
      {breadcrumbs.map((crumb, index) => (
        <motion.div
          key={crumb.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex items-center gap-1"
        >
          <button
            onClick={crumb.onClick}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm
                     transition-colors hover:bg-apple-secondary ${
                       index === breadcrumbs.length - 1
                         ? 'text-apple-text font-medium'
                         : 'text-apple-text-secondary hover:text-apple-text'
                     }`}
          >
            {crumb.icon && (
              <span className="text-base">{crumb.icon}</span>
            )}
            <span className="max-w-[150px] truncate">{crumb.name}</span>
          </button>
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-4 h-4 text-apple-text-secondary flex-shrink-0" />
          )}
        </motion.div>
      ))}
    </div>
  )
} 