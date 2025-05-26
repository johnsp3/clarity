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
import { ClipboardHandler } from '../utils/clipboard-handler'
import { detectTextFormatAI } from '../utils/chatgpt-editor';
import { detectContentFormat } from '../utils/format-detector';

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
        // Detect format from clipboard data using AI
        if (event.clipboardData && onFormatDetected) {
          // Get the plain text content for immediate detection
          const plainText = event.clipboardData.getData('text/plain');
          
          // Use AI-powered format detection for paste events
          if (plainText && plainText.trim()) {
            console.log('Paste detected, analyzing content:', plainText);
            detectTextFormatAI(plainText)
              .then(result => {
                console.log('Paste AI detection result:', result);
                onFormatDetected(result.format);
              })
              .catch(error => {
                console.error('AI format detection failed on paste:', error);
                // Fallback to clipboard handler
                ClipboardHandler.processClipboardData(event.clipboardData!)
                  .then(clipboardData => {
                    onFormatDetected(clipboardData.format);
                  })
                  .catch(fallbackError => {
                    console.error('Clipboard handler also failed:', fallbackError);
                    // Final fallback: local detection
                    const fallbackFormat = detectContentFormat(plainText);
                    onFormatDetected(fallbackFormat);
                  });
              });
          }
        }
        
        // Let Tiptap handle the paste normally
        return false;
      },
    },
    autofocus: false,
    editable: true,
  });
}; 