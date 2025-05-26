import React, { useState } from 'react'
import { Plus, FolderOpen, FileText, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../store/useStore'
import { SearchBar } from './SearchBar'
import { Button } from './Button'

export const Sidebar: React.FC = () => {
  const {
    projects,
    activeProjectId,
    searchQuery,
    setSearchQuery,
    setActiveProject,
    addProject,
  } = useStore()

  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      addProject({
        name: newProjectName.trim(),
        color: 'from-blue-400 to-blue-600',
        icon: '📁'
      })
      setNewProjectName('')
      setIsCreatingProject(false)
    }
  }

  const toggleProjectExpansion = (projectId: string) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId)
    } else {
      newExpanded.add(projectId)
    }
    setExpandedProjects(newExpanded)
  }

  return (
    <aside className="w-[250px] h-full bg-white border-r border-[#E5E5E7] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E5E7]">
        <h1 className="text-xl font-semibold text-[#1A1A1A]">Clarity</h1>
      </div>

      {/* Search */}
      <div className="p-4">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search notes..."
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4">
        {/* All Notes */}
        <motion.button
          whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveProject(null)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-[#1A1A1A] transition-colors ${
            activeProjectId === null ? 'bg-[#E5F0FF] text-[#0F62FE]' : ''
          }`}
        >
          <FileText size={16} />
          <span className="font-medium">All Notes</span>
        </motion.button>

        {/* Projects Section */}
        <div className="mt-6">
          <h2 className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2 px-3">
            Projects
          </h2>
          
          <div className="space-y-1">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <motion.button
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setActiveProject(project.id)
                    toggleProjectExpansion(project.id)
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-[#1A1A1A] transition-colors ${
                    activeProjectId === project.id ? 'bg-[#E5F0FF] text-[#0F62FE]' : ''
                  }`}
                >
                  <motion.div
                    animate={{ rotate: expandedProjects.has(project.id) ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronRight size={14} />
                  </motion.div>
                  
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
                  
                  <FolderOpen size={16} />
                  <span className="font-medium flex-1 text-left">{project.name}</span>
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </nav>

      {/* New Project Button */}
      <div className="p-4 border-t border-[#E5E5E7]">
        <AnimatePresence mode="wait">
          {isCreatingProject ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                placeholder="Project name..."
                className="flex-1 px-3 py-2 bg-[#FAFAFA] rounded-md text-sm
                         border border-transparent focus:border-[#0F62FE] 
                         focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20 
                         transition-all duration-150"
                autoFocus
              />
              <Button size="sm" onClick={handleCreateProject}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsCreatingProject(false)
                  setNewProjectName('')
                }}
              >
                Cancel
              </Button>
            </motion.div>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setIsCreatingProject(true)}
            >
              <Plus size={16} className="mr-2" />
              New Project
            </Button>
          )}
        </AnimatePresence>
      </div>
    </aside>
  )
} 