import React from 'react'
import { EditorStats } from '../../types/editor'
import { FileText, Clock, Hash, Type } from 'lucide-react'

interface StatusBarProps {
  stats: EditorStats
}

export const StatusBar: React.FC<StatusBarProps> = ({ stats }) => {
  return (
    <div className="h-8 px-4 bg-[#FAFAFA] border-t border-[#E5E5E7] flex items-center">
      <div className="flex items-center justify-between text-xs text-gray-600 w-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <FileText size={12} className="text-gray-400" />
            <span>{stats.words} {stats.words === 1 ? 'word' : 'words'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Hash size={12} className="text-gray-400" />
            <span>{stats.characters} {stats.characters === 1 ? 'character' : 'characters'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-gray-400" />
            <span>{stats.readingTime} min read</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Type size={12} className="text-gray-400" />
          <span className="capitalize">{stats.format}</span>
        </div>
      </div>
    </div>
  )
} 