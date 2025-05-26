import React from 'react';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import './editor.css';

interface TiptapEditorProps {
  editor: Editor | null;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ editor }) => {
  return (
    <EditorContent 
      editor={editor} 
      className="prose prose-sm max-w-none focus:outline-none min-h-full"
    />
  );
}; 