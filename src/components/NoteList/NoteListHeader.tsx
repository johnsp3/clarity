import React from 'react'
import { Plus, Grid, List as ListIcon, AlignLeft, SortDesc, Calendar, Edit2, Star } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ViewMode } from '../../types/editor'

interface NoteListHeaderProps {
  noteCount: number
  selectedCount: number
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  onCreateNote: () => void
  onSelectAll: () => void
  onClearSelection: () => void
  onDeleteSelected: () => void
}

export const NoteListHeader: React.FC<NoteListHeaderProps> = ({
  noteCount,
  selectedCount,
  viewMode,
  onViewModeChange,
  onCreateNote,
  onSelectAll,
  onClearSelection,
  onDeleteSelected
}) => {
  const viewOptions = [
    { value: 'list', label: 'List View', icon: ListIcon },
    { value: 'grid', label: 'Grid View', icon: Grid },
    { value: 'compact', label: 'Compact View', icon: AlignLeft }
  ]

  const sortOptions = [
    { value: 'modified', label: 'Last Modified', icon: Calendar },
    { value: 'created', label: 'Date Created', icon: Calendar },
    { value: 'title', label: 'Title', icon: Edit2 },
    { value: 'favorites', label: 'Favorites First', icon: Star }
  ]

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          Notes
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({noteCount})
          </span>
        </h2>
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">{selectedCount} selected</span>
            <button
              onClick={onClearSelection}
              className="text-blue-600 hover:text-blue-700"
              aria-label="Clear selection"
            >
              Clear
            </button>
            <button
              onClick={onDeleteSelected}
              className="text-red-600 hover:text-red-700"
              aria-label="Delete selected notes"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* View Mode Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Change view mode"
            >
              {viewMode.type === 'grid' ? <Grid size={20} /> : 
               viewMode.type === 'compact' ? <AlignLeft size={20} /> : 
               <ListIcon size={20} />}
            </button>
          </DropdownMenu.Trigger>
          
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-200 p-1"
              sideOffset={5}
            >
              {viewOptions.map((option) => (
                <DropdownMenu.Item
                  key={option.value}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none
                    ${viewMode.type === option.value 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  onSelect={() => onViewModeChange({ ...viewMode, type: option.value as ViewMode['type'] })}
                >
                  <option.icon size={16} />
                  {option.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Sort Dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Sort notes"
            >
              <SortDesc size={20} />
            </button>
          </DropdownMenu.Trigger>
          
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[200px] bg-white rounded-lg shadow-lg border border-gray-200 p-1"
              sideOffset={5}
            >
              <DropdownMenu.Label className="px-3 py-2 text-xs font-medium text-gray-500 uppercase">
                Sort By
              </DropdownMenu.Label>
              
              {sortOptions.map((option) => (
                <DropdownMenu.Item
                  key={option.value}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none
                    ${viewMode.sortBy === option.value 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  onSelect={() => onViewModeChange({ ...viewMode, sortBy: option.value as ViewMode['sortBy'] })}
                >
                  <option.icon size={16} />
                  {option.label}
                </DropdownMenu.Item>
              ))}
              
              <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
              
              <DropdownMenu.Item
                className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer outline-none text-gray-700 hover:bg-gray-100"
                onSelect={() => onViewModeChange({ 
                  ...viewMode, 
                  sortOrder: viewMode.sortOrder === 'asc' ? 'desc' : 'asc' 
                })}
              >
                <SortDesc size={16} className={viewMode.sortOrder === 'asc' ? 'rotate-180' : ''} />
                {viewMode.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* Select All Button */}
        {noteCount > 0 && (
          <button
            onClick={onSelectAll}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Select all notes"
            title="Select all"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        )}

        {/* Create Note Button */}
        <button
          onClick={onCreateNote}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          aria-label="Create new note"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">New Note</span>
        </button>
      </div>
    </div>
  )
} 