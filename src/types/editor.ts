export type ContentFormat = 'markdown' | 'html' | 'plain' | 'rich' | 'code' | 'docx' | 'rtf' | 'word' | 'json' | 'xml' | 'csv'

export interface FormatBadgeProps {
  format: ContentFormat
  visible: boolean
}

export interface ToolbarButton {
  name: string
  icon: React.ReactNode
  action: () => void
  isActive?: boolean
  tooltip: string
}

export interface EditorStats {
  words: number
  characters: number
  readingTime: number
  format: ContentFormat
}

export const formatColors: Record<ContentFormat, { gradient: string; icon: string }> = {
  markdown: { gradient: 'from-[#0071E3] to-[#0077ED]', icon: '📝' },
  html: { gradient: 'from-[#FF6B35] to-[#FF8F65]', icon: '🔧' },
  plain: { gradient: 'from-[#86868B] to-[#86868B]', icon: '📄' },
  rich: { gradient: 'from-[#8B5CF6] to-[#A78BFA]', icon: '✨' },
  code: { gradient: 'from-[#10B981] to-[#34D399]', icon: '💻' },
  docx: { gradient: 'from-[#2B579A] to-[#185ABD]', icon: '📘' },
  rtf: { gradient: 'from-[#D97706] to-[#F59E0B]', icon: '📋' },
  word: { gradient: 'from-[#2B579A] to-[#185ABD]', icon: '📄' },
  json: { gradient: 'from-[#059669] to-[#10B981]', icon: '🔗' },
  xml: { gradient: 'from-[#DC2626] to-[#EF4444]', icon: '📊' },
  csv: { gradient: 'from-[#7C3AED] to-[#8B5CF6]', icon: '📈' }
}

export type NoteType = 'markdown' | 'richtext'
export type NoteIcon = 'file-text' | 'file-edit' | 'image' | 'code'

export interface Tag {
  id: string
  name: string
  color: string
  createdAt: Date
  usageCount: number
}

export interface Folder {
  id: string
  name: string
  projectId: string
  parentId: string | null
  icon?: string
  noteCount: number
  lastModified: Date
  createdAt: Date
  isExpanded?: boolean
  order: number
}

export interface ProjectColor {
  gradient: string
  name: string
}

export const projectColors: ProjectColor[] = [
  { gradient: 'from-blue-400 to-blue-600', name: 'Blue' },
  { gradient: 'from-purple-400 to-purple-600', name: 'Purple' },
  { gradient: 'from-pink-400 to-pink-600', name: 'Pink' },
  { gradient: 'from-emerald-400 to-emerald-600', name: 'Green' },
  { gradient: 'from-orange-400 to-orange-600', name: 'Orange' },
  { gradient: 'from-red-400 to-red-600', name: 'Red' },
  { gradient: 'from-yellow-400 to-yellow-600', name: 'Yellow' },
  { gradient: 'from-indigo-400 to-indigo-600', name: 'Indigo' },
  { gradient: 'from-teal-400 to-teal-600', name: 'Teal' },
  { gradient: 'from-gray-400 to-gray-600', name: 'Gray' },
  { gradient: 'from-rose-400 to-rose-600', name: 'Rose' },
  { gradient: 'from-cyan-400 to-cyan-600', name: 'Cyan' },
]

export interface ViewMode {
  type: 'list' | 'grid' | 'compact'
  sortBy: 'modified' | 'created' | 'title' | 'manual'
  sortOrder: 'asc' | 'desc'
}

export interface SearchFilter {
  dateRange?: { start: Date; end: Date }
  projects?: string[]
  tags?: string[]
  hasAttachments?: boolean
  formatType?: ContentFormat
} 