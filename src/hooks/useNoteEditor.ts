import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CharacterCount from '@tiptap/extension-character-count';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';

export const useNoteEditor = (
  content: string, 
  onChange: (content: string) => void
) => {
  return useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors duration-150',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CharacterCount.configure({
        mode: 'textSize',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg shadow-sm my-4',
          style: 'width: 100%; height: auto;',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full px-8 py-6',
      },
      handlePaste: (_view, _event, _slice) => {
        // No automatic format detection on paste - content displays exactly as pasted
        // Let Tiptap handle the paste normally
        return false;
      },
    },
    autofocus: false,
    editable: true,
    // Parse content as HTML by default, but allow raw text preservation
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });
}; 