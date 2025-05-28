import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, FileText, Folder, Upload } from 'lucide-react'
import { useStore } from '../store/useStore'
import { parseNotePreview, calculateNoteMetadata } from '../utils/notePreviewParser'

export const FAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [showPulse, setShowPulse] = useState(true)
  const { addNote, activeProjectId, addFolder, activeFolderId } = useStore()

  const handleNewNote = () => {
    const content = ''
    const createdAt = new Date()
    addNote({
      title: '',
      content,
      projectId: activeProjectId,
      folderId: activeFolderId,
      tags: [],
      type: 'markdown',
      hasImages: false,
      hasCode: false,
      format: 'markdown',
      preview: parseNotePreview(content),
      metadata: calculateNoteMetadata(content, createdAt)
    })
    setIsOpen(false)
    setShowPulse(false)
  }

  const fabOptions = [
    {
      icon: FileText,
      label: 'New Note',
      onClick: handleNewNote,
      color: 'bg-[#0F62FE]',
    },
    {
      icon: Folder,
      label: 'New Folder',
      onClick: () => {
        const folderName = window.prompt('Enter folder name:')
        if (folderName && folderName.trim() && activeProjectId) {
          addFolder({
            name: folderName.trim(),
            projectId: activeProjectId,
            parentId: activeFolderId,
          })
        } else if (!activeProjectId) {
          alert('Please select a project first to create a folder')
        }
        setIsOpen(false)
      },
      color: 'bg-[#6B6B6B]',
    },
    {
      icon: Upload,
      label: 'Import Notes',
      onClick: () => {
        // Handle import
        console.log('Import notes')
        setIsOpen(false)
      },
      color: 'bg-[#6B6B6B]',
    },
  ]

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* FAB Options */}
      <AnimatePresence>
        {isOpen && (
          <>
            {fabOptions.map((option, index) => (
              <motion.div
                key={option.label}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8, 
                  y: 20,
                  transition: { delay: (fabOptions.length - index - 1) * 0.05 }
                }}
                className="absolute bottom-20 right-0"
                style={{ bottom: `${(index + 1) * 60 + 20}px` }}
              >
                <div className="flex items-center gap-3 relative">
                  {/* Label */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute right-16 whitespace-nowrap"
                  >
                    <div className="px-3 py-1.5 bg-[#1A1A1A] text-white text-sm rounded-md shadow-lg">
                      {option.label}
                    </div>
                  </motion.div>
                  
                  {/* Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={option.onClick}
                    className={`w-12 h-12 ${option.color} rounded-full shadow-lg
                             flex items-center justify-center transition-all duration-200`}
                  >
                    <option.icon size={20} strokeWidth={1.5} className="text-white" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen)
          setShowPulse(false)
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-14 h-14 bg-[#0F62FE] hover:bg-[#0043CE]
                 rounded-full shadow-xl hover:shadow-2xl transform 
                 transition-all duration-200 group overflow-hidden"
      >
        {/* Pulse animation on first load */}
        <AnimatePresence>
          {showPulse && (
            <>
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-[#0F62FE] rounded-full"
              />
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                className="absolute inset-0 bg-[#0F62FE] rounded-full"
              />
            </>
          )}
        </AnimatePresence>

        {/* Icon */}
        <div className="relative z-10 flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
          >
            <Plus size={24} strokeWidth={2} className="text-white" />
          </motion.div>
        </div>
      </motion.button>

      {/* Background overlay when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/5 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </div>
  )
} 