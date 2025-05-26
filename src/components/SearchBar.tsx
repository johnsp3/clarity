import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search notes...'
}) => {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      className="relative"
    >
      <motion.div
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.15 }}
        className="relative"
      >
        <Search 
          className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200 ${
            isFocused ? 'text-[#0F62FE]' : 'text-[#6B6B6B]'
          }`} 
          strokeWidth={1.5}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-3 bg-white
                     rounded-lg shadow-sm border border-[#E5E5E7] 
                     focus:border-[#0F62FE] focus:shadow-md
                     focus:outline-none focus:ring-2 focus:ring-[#0F62FE]/10 
                     transition-all duration-200 placeholder-[#9B9B9B]
                     text-[#1A1A1A] font-medium"
        />
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5
                       hover:bg-[#F5F5F5] rounded-md transition-colors"
            >
              <X size={14} strokeWidth={1.5} className="text-[#6B6B6B]" />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
} 