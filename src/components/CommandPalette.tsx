import React, { useState, useEffect, useRef, useMemo } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, FileText, Hash, 
  FolderOpen
} from 'lucide-react'
import { useStore, Note, Project } from '../store/useStore'
import { Tag } from '../types/editor'
import { formatDistanceToNow } from 'date-fns'

interface SearchResult {
  type: 'note' | 'project' | 'tag'
  item: Note | Project | Tag
  score: number
}

export const CommandPalette: React.FC = () => {
  const {
    notes,
    projects,
    tags,
    activeNoteId,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setActiveNote,
    setActiveProject,
  } = useStore()

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Fuzzy search implementation
  const searchResults = useMemo(() => {
    if (!debouncedQuery.trim()) {
      // Show recent notes when no query
      const recentNotes = notes
        .filter(note => note.id !== activeNoteId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map(note => ({
          type: 'note' as const,
          item: note,
          score: 0,
        }))

      return {
        recent: recentNotes,
        notes: [],
        projects: [],
        tags: [],
      }
    }

    const lowerQuery = debouncedQuery.toLowerCase()
    const results: {
      recent: SearchResult[]
      notes: SearchResult[]
      projects: SearchResult[]
      tags: SearchResult[]
    } = { recent: [], notes: [], projects: [], tags: [] }

    // Search notes
    notes.forEach(note => {
      const titleMatch = note.title.toLowerCase().includes(lowerQuery)
      const contentMatch = note.content.toLowerCase().includes(lowerQuery)
      
      // Check if any of the note's tags match the query
      const tagMatch = note.tags.some(tagId => {
        const tag = tags.find(t => t.id === tagId)
        return tag && tag.name.toLowerCase().includes(lowerQuery)
      })
      
      if (titleMatch || contentMatch || tagMatch) {
        const matches: string[] = []
        if (titleMatch) matches.push('title')
        if (contentMatch) matches.push('content')
        if (tagMatch) matches.push('tags')
        
        results.notes.push({
          type: 'note',
          item: note,
          score: matches.length,
        })
      }
    })

    // Search projects
    projects.forEach(project => {
      const nameMatch = project.name.toLowerCase().includes(lowerQuery)
      const descriptionMatch = project.description?.toLowerCase().includes(lowerQuery) || false
      
      if (nameMatch || descriptionMatch) {
        results.projects.push({
          type: 'project',
          item: project,
          score: 1,
        })
      }
    })

    // Search tags
    tags.forEach(tag => {
      if (tag.name.toLowerCase().includes(lowerQuery)) {
        results.tags.push({
          type: 'tag',
          item: tag,
          score: 1,
        })
      }
    })

    // Sort by relevance
    results.notes.sort((a, b) => b.score - a.score)
    results.projects.sort((a, b) => b.score - a.score)
    results.tags.sort((a, b) => b.score - a.score)

    return results
  }, [debouncedQuery, notes, projects, tags, activeNoteId])

  // Calculate total results for navigation
  const totalResults = 
    searchResults.recent.length +
    searchResults.notes.length +
    searchResults.projects.length +
    searchResults.tags.length

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommandPaletteOpen) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault()
          setCommandPaletteOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => 
            Math.min(prev + 1, totalResults - 1)
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          handleResultClick(getResultAtIndex(selectedIndex))
          break
        case 'Escape':
          e.preventDefault()
          setCommandPaletteOpen(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommandPaletteOpen, selectedIndex, totalResults, setCommandPaletteOpen])

  // Reset state when closing
  useEffect(() => {
    if (!isCommandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isCommandPaletteOpen])

  const getResultAtIndex = (index: number): SearchResult | null => {
    let currentIndex = 0
    
    for (const result of searchResults.recent) {
      if (currentIndex === index) return result
      currentIndex++
    }
    
    for (const result of searchResults.notes) {
      if (currentIndex === index) return result
      currentIndex++
    }
    
    for (const result of searchResults.projects) {
      if (currentIndex === index) return result
      currentIndex++
    }
    
    for (const result of searchResults.tags) {
      if (currentIndex === index) return result
      currentIndex++
    }
    
    return null
  }

  const handleResultClick = (result: SearchResult | null) => {
    if (!result) return

    switch (result.type) {
      case 'note':
        setActiveNote((result.item as Note).id)
        break
      case 'project':
        setActiveProject((result.item as Project).id)
        break
      case 'tag': {
        // Apply tag filter
        const tag = result.item as Tag
        const currentFilters = useStore.getState().searchFilters
        useStore.getState().setSearchFilters({
          ...currentFilters,
          tags: [tag.id]
        })
        break
      }
    }

    setCommandPaletteOpen(false)
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-[rgba(0,122,255,0.2)] text-[#007AFF] font-medium px-0">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  const formatDate = (date: Date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }

  const renderResultItem = (result: SearchResult, _index: number, currentIndex: number) => {
    const isSelected = currentIndex === selectedIndex
    
    switch (result.type) {
      case 'note': {
        const note = result.item as Note
        return (
          <button
            key={`note-${note.id}`}
            onClick={() => handleResultClick(result)}
            className={`w-full px-6 py-4 hover:bg-[#F5F5F7] cursor-pointer border-l-2 
                      transition-all duration-150 text-left flex items-center gap-4 active:scale-[0.98] ${
                        isSelected 
                          ? 'bg-[#F5F5F7] border-[#007AFF]' 
                          : 'border-transparent'
                      }`}
          >
            <div style={{ color: 'rgba(0, 0, 0, 0.6)' }}>
              <FileText size={20} strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-black truncate text-[15px]">
                {highlightMatch(note.title || 'Untitled', query)}
              </div>
              {query && (
                <div className="text-apple-caption truncate mt-1">
                  {highlightMatch(note.content.substring(0, 100), query)}...
                </div>
              )}
            </div>
            
            <div className="text-apple-caption">
              {formatDate(note.updatedAt)}
            </div>
          </button>
        )
      }
      
      case 'project': {
        const project = result.item as Project
        return (
          <button
            key={`project-${project.id}`}
            onClick={() => handleResultClick(result)}
            className={`w-full px-4 py-3 hover:bg-[#F5F5F5] cursor-pointer border-l-2 
                      transition-all duration-150 text-left flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-[#F5F5F5] border-[#0F62FE]' 
                          : 'border-transparent'
                      }`}
          >
            <div className="text-[#6B6B6B]">
              <FolderOpen size={18} strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#1A1A1A] truncate">
                {highlightMatch(project.name, query)}
              </div>
              {project.description && (
                <div className="text-sm text-[#6B6B6B] truncate">
                  {project.description}
                </div>
              )}
            </div>
          </button>
        )
      }
      
      case 'tag': {
        const tag = result.item as Tag
        // Calculate actual usage count dynamically
        const actualUsageCount = notes.filter(note => note.tags.includes(tag.id)).length
        
        return (
          <button
            key={`tag-${tag.id}`}
            onClick={() => handleResultClick(result)}
            className={`w-full px-4 py-3 hover:bg-[#F5F5F5] cursor-pointer border-l-2 
                      transition-all duration-150 text-left flex items-center gap-3 ${
                        isSelected 
                          ? 'bg-[#F5F5F5] border-[#0F62FE]' 
                          : 'border-transparent'
                      }`}
          >
            <div className="text-[#6B6B6B]">
              <Hash size={18} strokeWidth={1.5} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-[#1A1A1A]">
                {highlightMatch(tag.name, query)}
              </div>
              <div className="text-sm text-[#6B6B6B]">
                {actualUsageCount} {actualUsageCount === 1 ? 'note' : 'notes'}
              </div>
            </div>
          </button>
        )
      }
    }
  }

  let resultIndex = 0

  return (
    <Dialog.Root open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <Dialog.Portal>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>
            
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
              >
                <div className="relative w-[600px] max-h-[60vh] bg-white rounded-lg border border-[#E5E5E5] overflow-hidden animate-apple-scale-in"
                     style={{ boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)' }}>
                  {/* Search Input */}
                  <div className="border-b border-[#E5E5E5] p-6">
                    <div className="flex items-center gap-4">
                      <Search size={22} strokeWidth={1.5} style={{ color: 'rgba(0, 0, 0, 0.6)' }} />
                      <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search notes, content, or type a command..."
                        className="w-full text-[18px] bg-transparent outline-none text-black placeholder-[rgba(0,0,0,0.4)]"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Results */}
                  <div className="overflow-y-auto max-h-[calc(60vh-80px)]">
                    {totalResults === 0 && query.trim() && (
                      <div className="py-12 text-center text-apple-body-secondary">
                        No results found for "{query}"
                      </div>
                    )}

                    {/* Recent Notes */}
                    {searchResults.recent.length > 0 && (
                      <>
                        <div className="px-6 py-3 text-apple-footnote bg-[#F5F5F7]">
                          Recent
                        </div>
                        {searchResults.recent.map((result, index) => 
                          renderResultItem(result, index, resultIndex++)
                        )}
                      </>
                    )}

                    {/* Notes Results */}
                    {searchResults.notes.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-medium text-[#6B6B6B] uppercase 
                                      tracking-wider bg-[#FAFAFA]">
                          Notes
                        </div>
                        {searchResults.notes.map((result, index) => 
                          renderResultItem(result, index, resultIndex++)
                        )}
                      </>
                    )}

                    {/* Projects Results */}
                    {searchResults.projects.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-medium text-[#6B6B6B] uppercase 
                                      tracking-wider bg-[#FAFAFA]">
                          Projects
                        </div>
                        {searchResults.projects.map((result, index) => 
                          renderResultItem(result, index, resultIndex++)
                        )}
                      </>
                    )}

                    {/* Tags Results */}
                    {searchResults.tags.length > 0 && (
                      <>
                        <div className="px-4 py-2 text-xs font-medium text-[#6B6B6B] uppercase 
                                      tracking-wider bg-[#FAFAFA]">
                          Tags
                        </div>
                        {searchResults.tags.map((result, index) => 
                          renderResultItem(result, index, resultIndex++)
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer with keyboard hints */}
                  {totalResults > 0 && (
                    <div className="border-t border-[#E5E5E5] px-6 py-3 flex items-center 
                                  justify-between text-apple-caption">
                      <div className="flex items-center gap-6">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                        <span>esc Close</span>
                      </div>
                      <div>
                        {totalResults} result{totalResults !== 1 ? 's' : ''}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
} 