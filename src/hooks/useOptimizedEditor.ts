import { useEditor } from '@tiptap/react';
import { useCallback, useRef, useEffect, useMemo } from 'react';
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

interface UseOptimizedEditorProps {
  content: string;
  onChange: (content: string) => void;
  noteId: string;
  debounceMs?: number;
}

export const useOptimizedEditor = ({
  content,
  onChange,
  noteId,
  debounceMs = 300
}: UseOptimizedEditorProps) => {
  const debounceRef = useRef<NodeJS.Timeout>();
  const lastNoteIdRef = useRef<string>(noteId);
  const isUpdatingRef = useRef(false);

  // Memoize extensions to prevent recreation
  const extensions = useMemo(() => [
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
    Image.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'max-w-full h-auto rounded-lg shadow-sm my-4',
        style: 'width: 100%; height: auto;',
      },
    }),
  ], []);

  // Debounced onChange handler
  const debouncedOnChange = useCallback((newContent: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChange(newContent);
    }, debounceMs);
  }, [onChange, debounceMs]);

  const editor = useEditor({
    extensions,
    content,
    onUpdate: ({ editor }) => {
      if (!isUpdatingRef.current) {
        debouncedOnChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full px-8 py-6',
      },
      handlePaste: (_view, _event, _slice) => {
        return false;
      },
    },
    autofocus: false,
    editable: true,
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

  // Handle note switching without recreating editor
  useEffect(() => {
    if (editor && noteId !== lastNoteIdRef.current) {
      isUpdatingRef.current = true;
      
      // Clear any pending debounced updates
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      // Update content without triggering onChange
      editor.commands.setContent(content || '', false);
      
      lastNoteIdRef.current = noteId;
      
      // Re-enable onChange after a brief delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  }, [editor, noteId, content]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return editor;
}; 