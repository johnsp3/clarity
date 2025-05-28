import React, { useState } from 'react'
import { X, Plus, Tag as TagIcon } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { useStore, getNextAvailableColor } from '../store/useStore'

interface NoteTagEditorProps {
  noteId: string
  noteTags: string[]
}

export const NoteTagEditor: React.FC<NoteTagEditorProps> = ({ noteId, noteTags }) => {
  const { tags, updateNote, addTag } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newTagName, setNewTagName] = useState('')

  const availableTags = tags.filter(tag => !noteTags.includes(tag.id))
  const filteredTags = availableTags.filter(tag => 
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const selectedTags = tags.filter(tag => noteTags.includes(tag.id))
  
  // Get the color that would be assigned to a new tag
  const nextTagColor = getNextAvailableColor(tags)

  const handleAddTag = (tagId: string) => {
    updateNote(noteId, { tags: [...noteTags, tagId] })
    setSearchQuery('')
  }

  const handleRemoveTag = (tagId: string) => {
    updateNote(noteId, { tags: noteTags.filter(id => id !== tagId) })
  }

  const handleCreateAndAddTag = () => {
    if (newTagName.trim()) {
      const newTag = addTag(newTagName.trim())
      updateNote(noteId, { tags: [...noteTags, newTag.id] })
      setNewTagName('')
      setSearchQuery('')
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Display selected tags */}
      {selectedTags.map(tag => (
        <div
          key={tag.id}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r ${tag.color} 
                   text-white rounded-full font-medium group hover:scale-105 transition-transform`}
        >
          <TagIcon size={12} strokeWidth={1.5} />
          {tag.name}
          <button
            onClick={() => handleRemoveTag(tag.id)}
            className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={12} strokeWidth={2} />
          </button>
        </div>
      ))}

      {/* Add tag button */}
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger asChild>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 
                     hover:bg-gray-200 text-gray-700 rounded-full font-medium 
                     transition-colors"
          >
            <Plus size={12} strokeWidth={1.5} />
            Add Tag
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            className="w-[250px] bg-white rounded-xl shadow-2xl border border-gray-200 p-3 z-[95]"
            sideOffset={5}
          >
            {/* Search/Create input */}
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setNewTagName(e.target.value)
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newTagName.trim() && filteredTags.length === 0) {
                    handleCreateAndAddTag()
                  }
                }}
                placeholder="Search or create tag..."
                className="w-full px-3 py-2 text-sm bg-gray-50 rounded-lg border border-gray-200 
                         focus:border-indigo-300 focus:bg-white focus:outline-none 
                         focus:ring-2 focus:ring-indigo-500/20"
                autoFocus
              />
            </div>

            {/* Tag suggestions */}
            <div className="max-h-[200px] overflow-y-auto space-y-1">
              {filteredTags.length === 0 && searchQuery.trim() ? (
                <button
                  onClick={handleCreateAndAddTag}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left 
                           hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={`w-6 h-6 rounded bg-gradient-to-r ${nextTagColor} 
                                flex items-center justify-center`}>
                    <Plus size={12} strokeWidth={1.5} className="text-white" />
                  </div>
                  <span className="text-gray-700">
                    Create "<span className="font-medium">{searchQuery}</span>"
                  </span>
                </button>
              ) : (
                filteredTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left 
                             hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className={`w-6 h-6 rounded bg-gradient-to-r ${tag.color} 
                                  flex items-center justify-center`}>
                      <TagIcon size={12} strokeWidth={1.5} className="text-white" />
                    </div>
                    <span className="text-gray-700">{tag.name}</span>
                  </button>
                ))
              )}

              {filteredTags.length === 0 && !searchQuery.trim() && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No more tags available
                </p>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
} 