import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link2,
  List,
  ListOrdered,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Sparkles
} from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import clsx from 'clsx'

interface FloatingToolbarProps {
  editor: Editor | null
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  tooltip: string
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
  tooltip
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2,
    })
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      animate={{
        x: isHovered ? mousePos.x * 0.1 : 0,
        y: isHovered ? mousePos.y * 0.1 : 0,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={clsx(
        'relative p-2.5 rounded-xl transition-all duration-300 group',
        isActive
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
          : 'hover:bg-white/60 text-gray-700 hover:shadow-md'
      )}
      title={tooltip}
    >
      <motion.div
        animate={{ rotate: isActive ? 360 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
      
      {/* Premium tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.span 
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 
                     bg-gray-900 text-white text-xs rounded-lg
                     whitespace-nowrap pointer-events-none z-50 shadow-xl"
          >
            {tooltip}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 
                          w-2 h-2 bg-gray-900 rotate-45" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

const ToolbarDivider: React.FC = () => (
  <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-1" />
)

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor }) => {
  const toolbarRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHeadingMenu, setShowHeadingMenu] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [textColor, setTextColor] = useState('#000000')

  useEffect(() => {
    if (!editor) return

    const updateToolbarPosition = () => {
      const { state } = editor
      const { from, to } = state.selection
      const hasSelection = from !== to

      if (!hasSelection || !editor.isFocused) {
        setIsVisible(false)
        return
      }

      setIsVisible(true)
      
      // Update text color state
      const currentColor = editor.getAttributes('textStyle').color || '#000000'
      setTextColor(currentColor)

      // Get selection coordinates
      try {
        const view = editor.view
        const start = view.coordsAtPos(from)
        const end = view.coordsAtPos(to)
        
        const selectionBounds = {
          left: Math.min(start.left, end.left),
          top: start.top,
          width: Math.abs(end.left - start.left),
          height: end.bottom - start.top
        }

        // Calculate toolbar position
        const toolbarWidth = 650 // Approximate width
        const left = selectionBounds.left + (selectionBounds.width / 2) - (toolbarWidth / 2)
        const top = selectionBounds.top - 85 // Position above selection with more space

        setPosition({
          top: Math.max(10, top),
          left: Math.max(10, left)
        })
      } catch (error) {
        console.error('Error positioning toolbar:', error)
        setIsVisible(false)
      }
    }

    // Handle click outside for color picker
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
    }

    editor.on('selectionUpdate', updateToolbarPosition)
    editor.on('focus', updateToolbarPosition)
    editor.on('blur', () => {
      // Don't hide if clicking within toolbar or color picker
      setTimeout(() => {
        const activeElement = document.activeElement
        const isToolbarFocused = toolbarRef.current?.contains(activeElement)
        const isColorPickerFocused = colorPickerRef.current?.contains(activeElement)
        
        if (!isToolbarFocused && !isColorPickerFocused) {
          setIsVisible(false)
          setShowColorPicker(false)
          setShowHeadingMenu(false)
        }
      }, 100)
    })

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      editor.off('selectionUpdate', updateToolbarPosition)
      editor.off('focus', updateToolbarPosition)
      editor.off('blur')
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editor, showColorPicker])

  if (!editor || !isVisible) return null

  return (
    <motion.div
      ref={toolbarRef}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="fixed z-[90] glass rounded-2xl shadow-2xl p-2
               border border-white/20"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onMouseDown={(e) => e.preventDefault()} // Prevent editor from losing focus
    >
      {/* Gradient border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 
                    rounded-2xl opacity-20 blur-sm -z-10" />
      
      <div className="flex items-center gap-1">
        {/* Text formatting group */}
        <div className="flex items-center gap-0.5 bg-white/30 rounded-xl p-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            tooltip="Bold (⌘B)"
          >
            <Bold size={18} strokeWidth={1.5} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            tooltip="Italic (⌘I)"
          >
            <Italic size={18} strokeWidth={1.5} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            tooltip="Underline (⌘U)"
          >
            <Underline size={18} strokeWidth={1.5} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            tooltip="Strikethrough"
          >
            <Strikethrough size={18} strokeWidth={1.5} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Headings dropdown with sparkle */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowHeadingMenu(!showHeadingMenu)}
            tooltip="Headings"
          >
            <div className="relative">
              <Type size={18} strokeWidth={1.5} />
              <Sparkles size={10} className="absolute -top-1 -right-1 text-yellow-500" />
            </div>
          </ToolbarButton>
          
          <AnimatePresence>
            {showHeadingMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-full mt-2 left-0 glass rounded-xl shadow-2xl 
                         border border-white/20 p-1.5 min-w-[140px] z-[95]"
              >
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                    setShowHeadingMenu(false)
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-white/50 
                           rounded-lg text-left text-sm transition-colors"
                >
                  <Heading1 size={16} strokeWidth={1.5} /> 
                  <span className="font-bold">Heading 1</span>
                </motion.button>
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                    setShowHeadingMenu(false)
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-white/50 
                           rounded-lg text-left text-sm transition-colors"
                >
                  <Heading2 size={16} strokeWidth={1.5} /> 
                  <span className="font-semibold">Heading 2</span>
                </motion.button>
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                    setShowHeadingMenu(false)
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2 hover:bg-white/50 
                           rounded-lg text-left text-sm transition-colors"
                >
                  <Heading3 size={16} strokeWidth={1.5} /> 
                  <span className="font-medium">Heading 3</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ToolbarDivider />

        {/* Lists group */}
        <div className="flex items-center gap-0.5 bg-white/30 rounded-xl p-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            tooltip="Bullet List"
          >
            <List size={18} strokeWidth={1.5} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            tooltip="Numbered List"
          >
            <ListOrdered size={18} strokeWidth={1.5} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Special formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          tooltip="Quote"
        >
          <Quote size={18} strokeWidth={1.5} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          tooltip="Code Block"
        >
          <Code size={18} strokeWidth={1.5} />
        </ToolbarButton>
        
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          isActive={editor.isActive('link')}
          tooltip="Insert Link (⌘K)"
        >
          <Link2 size={18} strokeWidth={1.5} />
        </ToolbarButton>

        <ToolbarDivider />

        {/* Text align group */}
        <div className="flex items-center gap-0.5 bg-white/30 rounded-xl p-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            tooltip="Align Left"
          >
            <AlignLeft size={18} strokeWidth={1.5} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            tooltip="Align Center"
          >
            <AlignCenter size={18} strokeWidth={1.5} />
          </ToolbarButton>
          
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            tooltip="Align Right"
          >
            <AlignRight size={18} strokeWidth={1.5} />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Color picker with gradient preview */}
        <div className="relative">
          <ToolbarButton
            onClick={() => setShowColorPicker(!showColorPicker)}
            tooltip="Text Color"
          >
            <div className="relative">
              <Palette size={18} strokeWidth={1.5} />
              <div 
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white shadow-sm"
                style={{ 
                  backgroundColor: textColor
                }}
              />
            </div>
          </ToolbarButton>
          
          <AnimatePresence>
            {showColorPicker && (
              <motion.div
                ref={colorPickerRef}
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="absolute top-full mt-2 right-0 p-3 glass rounded-2xl 
                         shadow-2xl border border-white/20 z-[100]"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
              >
                <div className="mb-2 text-sm font-medium text-gray-700">Text Color</div>
                <HexColorPicker
                  color={textColor}
                  onChange={(color) => {
                    setTextColor(color)
                    editor.chain().focus().setColor(color).run()
                  }}
                />
                {/* Preset colors */}
                <div className="flex gap-1 mt-3">
                  {['#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#007AFF', '#EC4899', '#6B7280'].map((color) => (
                    <motion.button
                      key={color}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        setTextColor(color)
                        editor.chain().focus().setColor(color).run()
                      }}
                      className="w-6 h-6 rounded-full shadow-md border border-gray-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {/* Reset color button */}
                <button
                  onClick={() => {
                    setTextColor('#000000')
                    editor.chain().focus().unsetColor().run()
                  }}
                  className="mt-2 w-full text-xs text-gray-600 hover:text-gray-800 
                           py-1 hover:bg-white/50 rounded-lg transition-colors"
                >
                  Reset to default
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
} 