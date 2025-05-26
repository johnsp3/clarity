import React, { useState } from 'react'
import { X, Plus, Tag as TagIcon, Edit2, Trash2, Check } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useStore } from '../store/useStore'
import { Tag } from '../types/editor'

export const TagManager: React.FC = () => {
  const { tags, addTag, updateTag, deleteTag, notes } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editingName, setEditingName] = useState('')

  const tagColors = [
    'from-blue-400 to-blue-600',
    'from-purple-400 to-purple-600',
    'from-pink-400 to-pink-600',
    'from-emerald-400 to-emerald-600',
    'from-orange-400 to-orange-600',
    'from-red-400 to-red-600',
    'from-yellow-400 to-yellow-600',
    'from-indigo-400 to-indigo-600',
    'from-teal-400 to-teal-600',
    'from-gray-400 to-gray-600',
  ]

  const getTagUsageCount = (tagId: string) => {
    return notes.filter(note => note.tags.includes(tagId)).length
  }

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      addTag(newTagName.trim())
      setNewTagName('')
    }
  }

  const handleUpdateTag = () => {
    if (editingTag && editingName.trim()) {
      updateTag(editingTag.id, { name: editingName.trim() })
      setEditingTag(null)
      setEditingName('')
    }
  }

  const handleDeleteTag = (tag: Tag) => {
    if (confirm(`Are you sure you want to delete the tag "${tag.name}"? This will remove it from all notes.`)) {
      deleteTag(tag.id)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 
                   hover:bg-gray-100 rounded-lg transition-colors"
        >
          <TagIcon size={16} strokeWidth={1.5} />
          Manage Tags
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 
                                 bg-white rounded-2xl shadow-2xl p-6 w-[500px] max-h-[80vh] 
                                 overflow-hidden z-[101]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                Manage Tags
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-600 mt-1">
                Create and organize tags for your notes
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X size={20} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          {/* Create new tag */}
          <div className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                placeholder="Create new tag..."
                className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 
                         focus:border-indigo-300 focus:bg-white focus:outline-none 
                         focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
              />
              <button
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 
                         text-white rounded-xl font-medium shadow-sm hover:shadow-md 
                         transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
              >
                <Plus size={16} strokeWidth={1.5} />
                Add Tag
              </button>
            </div>
          </div>

          {/* Tags list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {tags.length === 0 ? (
              <div className="text-center py-12">
                <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
                <p className="text-gray-600">No tags yet. Create your first tag above!</p>
              </div>
            ) : (
              tags.map((tag) => {
                const usageCount = getTagUsageCount(tag.id)
                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 
                             transition-colors group"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${tag.color} 
                                    flex items-center justify-center shadow-sm`}>
                        <TagIcon size={14} strokeWidth={1.5} className="text-white" />
                      </div>
                      
                      {editingTag?.id === tag.id ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') handleUpdateTag()
                            if (e.key === 'Escape') {
                              setEditingTag(null)
                              setEditingName('')
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-white rounded-lg border border-indigo-300 
                                   focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          autoFocus
                        />
                      ) : (
                        <>
                          <span className="font-medium text-gray-900">{tag.name}</span>
                          <span className="text-sm text-gray-500">
                            {usageCount} {usageCount === 1 ? 'note' : 'notes'}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingTag?.id === tag.id ? (
                        <>
                          <button
                            onClick={handleUpdateTag}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Check size={16} strokeWidth={1.5} className="text-green-600" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTag(null)
                              setEditingName('')
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <X size={16} strokeWidth={1.5} className="text-gray-600" />
                          </button>
                        </>
                      ) : (
                        <>
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                              <button
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <div className="w-4 h-4 rounded grid grid-cols-2 gap-0.5">
                                  {tagColors.slice(0, 4).map((color, i) => (
                                    <div key={i} className={`rounded-sm bg-gradient-to-r ${color}`} />
                                  ))}
                                </div>
                              </button>
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Portal>
                              <DropdownMenu.Content
                                className="bg-white rounded-xl shadow-xl p-2 grid grid-cols-5 gap-1"
                                sideOffset={5}
                              >
                                {tagColors.map((color) => (
                                  <DropdownMenu.Item
                                    key={color}
                                    onClick={() => updateTag(tag.id, { color })}
                                    className="cursor-pointer"
                                  >
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${color} 
                                                  hover:scale-110 transition-transform`} />
                                  </DropdownMenu.Item>
                                ))}
                              </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                          </DropdownMenu.Root>
                          
                          <button
                            onClick={() => {
                              setEditingTag(tag)
                              setEditingName(tag.name)
                            }}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} strokeWidth={1.5} className="text-gray-600" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} strokeWidth={1.5} className="text-red-600" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 