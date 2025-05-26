import React from 'react'
import { motion } from 'framer-motion'

export const NoteListSkeleton: React.FC = () => {
  return (
    <div className="p-4 space-y-2">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
          className="p-3 rounded-apple bg-apple-secondary animate-pulse"
        >
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-300 rounded w-full mb-1" />
          <div className="h-3 bg-gray-300 rounded w-2/3" />
        </motion.div>
      ))}
    </div>
  )
}

export const EditorSkeleton: React.FC = () => {
  return (
    <div className="flex-1 p-6 animate-pulse">
      <div className="h-10 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  )
} 