import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles } from 'lucide-react'
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      addProject({
        name: name.trim(),
        description: description.trim(),
      })
      // Reset form
      setName('')
      setDescription('')
      onOpenChange(false)
    }
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
                <Dialog.Title className="text-apple-title-md mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#007AFF]" />
                  Create New Collection
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Input */}
                  <div>
                    <label htmlFor="name" className="block text-[15px] font-medium text-[#1D1D1F] mb-2">
                      Collection Name
                    </label>
                    <div className="relative">
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="My Collection"
                        maxLength={30}
                        className="input-apple pr-16"
                        autoFocus
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] text-[#86868B]">
                        {name.length}/30
                      </span>
                    </div>
                  </div>

                  {/* Description Input */}
                  <div>
                    <label htmlFor="description" className="block text-[15px] font-medium text-[#1D1D1F] mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What's this collection about?"
                      rows={3}
                      className="input-apple resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={!name.trim()}
                      className="flex-1"
                    >
                      Create Collection
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
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#F5F5F7]
                             transition-colors duration-200"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-[#86868B]" />
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