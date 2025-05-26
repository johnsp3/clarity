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
import { ClipboardHandler } from '../utils/clipboard-handler';

export const useNoteEditor = (
  content: string, 
  onChange: (content: string) => void,
  onFormatDetected?: (format: string) => void
) => {
  return useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline transition-colors duration-150',
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
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full px-8 py-6',
      },
      handlePaste: (_view, event, _slice) => {
        // Detect format from clipboard data
        if (event.clipboardData && onFormatDetected) {
          // Process clipboard data asynchronously without blocking paste
          ClipboardHandler.processClipboardData(event.clipboardData)
            .then(clipboardData => {
              onFormatDetected(clipboardData.format);
            })
            .catch(error => {
              console.error('Error processing clipboard data:', error);
            });
        }
        
        // Let Tiptap handle the paste normally
        return false;
      },
    },
    autofocus: false,
    editable: true,
  });
}; 