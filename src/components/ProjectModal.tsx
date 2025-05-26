import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
import Picker from '@emoji-mart/react'
import data from '@emoji-mart/data'
import { projectColors } from '../types/editor'
import { useStore } from '../store/useStore'
import { Button } from './Button'

interface ProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ open, onOpenChange }) => {
  const { addProject } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState(projectColors[0])
  const [selectedIcon, setSelectedIcon] = useState('📁')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      addProject({
        name: name.trim(),
        description: description.trim(),
        color: selectedColor.gradient,
        icon: selectedIcon,
      })
      // Reset form
      setName('')
      setDescription('')
      setSelectedColor(projectColors[0])
      setSelectedIcon('📁')
      onOpenChange(false)
    }
  }

  const handleEmojiSelect = (emoji: any) => {
    setSelectedIcon(emoji.native)
    setShowEmojiPicker(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
            <Dialog.Content className="fixed top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 
                                     bg-white rounded-2xl shadow-2xl p-6 w-[450px] max-h-[90vh] 
                                     overflow-y-auto z-[101]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="space-y-6"
              >
                <Dialog.Title className="text-2xl font-semibold text-[#1A1A1A] mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#0F62FE]" />
                  Create New Project
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Icon Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#6B6B6B] mb-2">
                      Project Icon
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="w-16 h-16 rounded-xl bg-[#FAFAFA] flex items-center justify-center
                                 text-3xl hover:scale-105 transition-transform duration-200"
                      >
                        {selectedIcon}
                      </button>
                      <span className="text-sm text-[#6B6B6B]">
                        Click to change icon
                      </span>
                    </div>
                    
                    {showEmojiPicker && (
                      <div className="absolute mt-2 z-50">
                        <Picker
                          data={data}
                          onEmojiSelect={handleEmojiSelect}
                          theme="light"
                          previewPosition="none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Name Input */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#6B6B6B] mb-2">
                      Project Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Awesome Project"
                        maxLength={30}
                        className="w-full px-4 py-3 bg-[#FAFAFA] rounded-xl border border-transparent
                                 focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20
                                 transition-all duration-200 pr-16"
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B]">
                        {name.length}/30
                      </span>
                    </div>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#6B6B6B] mb-3">
                      Project Color
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                      {projectColors.map((color) => (
                        <motion.button
                          key={color.name}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedColor(color)}
                          className={`relative w-full aspect-square rounded-xl bg-gradient-to-br ${color.gradient}
                                    transition-all duration-200 ${
                                      selectedColor.name === color.name
                                        ? 'ring-2 ring-offset-2 ring-[#0F62FE]'
                                        : ''
                                    }`}
                        >
                          {selectedColor.name === color.name && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[#6B6B6B] mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this project about?"
                      rows={3}
                      className="w-full px-4 py-3 bg-[#FAFAFA] rounded-xl border border-transparent
                               focus:border-[#0F62FE] focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/20
                               transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={!name.trim()}
                      className="flex-1"
                    >
                      Create Project
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>

                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#FAFAFA]
                             transition-colors duration-200"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-[#6B6B6B]" />
                  </button>
                </Dialog.Close>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
} 