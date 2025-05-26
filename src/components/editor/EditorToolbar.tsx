import React from 'react';
import type { Editor } from '@tiptap/react';
import { Bold, Italic, List, Link2, Code } from 'lucide-react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor || editor.isDestroyed) {
    return null;
  }

  return (
    <div className="h-10 flex items-center px-4 border-b border-[#E5E5E7] bg-white">
      <div className="flex items-center space-x-1">
        {/* Bold */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded transition-colors duration-150 ${
            editor.isActive('bold') ? 'bg-[#E5F0FF] text-[#0F62FE]' : 'hover:bg-gray-100'
          }`}
          title="Bold (⌘B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        {/* Italic */}
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded transition-colors duration-150 ${
            editor.isActive('italic') ? 'bg-[#E5F0FF] text-[#0F62FE]' : 'hover:bg-gray-100'
          }`}
          title="Italic (⌘I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-[#E5E5E7] mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded transition-colors duration-150 ${
            editor.isActive('bulletList') ? 'bg-[#E5F0FF] text-[#0F62FE]' : 'hover:bg-gray-100'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        {/* Link */}
        <button
          onClick={() => {
            const url = window.prompt('Enter URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={`p-2 rounded transition-colors duration-150 ${
            editor.isActive('link') ? 'bg-[#E5F0FF] text-[#0F62FE]' : 'hover:bg-gray-100'
          }`}
          title="Add Link (⌘K)"
        >
          <Link2 className="w-4 h-4" />
        </button>

        {/* Code */}
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded transition-colors duration-150 ${
            editor.isActive('code') ? 'bg-[#E5F0FF] text-[#0F62FE]' : 'hover:bg-gray-100'
          }`}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}; 