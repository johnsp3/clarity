import React from 'react'
import { skipToMain } from '../utils/accessibility'

export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-0 left-0 z-[100] bg-white p-2 shadow-lg">
        <a
          href="#main-content"
          onClick={(e) => {
            e.preventDefault()
            skipToMain('main-content')
          }}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Skip to main content
        </a>
        <a
          href="#sidebar-navigation"
          onClick={(e) => {
            e.preventDefault()
            const sidebar = document.getElementById('sidebar-navigation')
            if (sidebar) {
              sidebar.tabIndex = -1
              sidebar.focus()
              sidebar.scrollIntoView()
            }
          }}
          className="inline-block ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Skip to navigation
        </a>
        <a
          href="#notes-list"
          onClick={(e) => {
            e.preventDefault()
            const notesList = document.getElementById('notes-list')
            if (notesList) {
              notesList.tabIndex = -1
              notesList.focus()
              notesList.scrollIntoView()
            }
          }}
          className="inline-block ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Skip to notes list
        </a>
      </div>
    </div>
  )
} 