import React, { useState, useCallback } from 'react';
import { EditorContent } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import './editor.css';

interface TiptapEditorProps {
  editor: Editor | null;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ editor }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Check if file is a supported image format
  const isImageFile = (file: File): boolean => {
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    return supportedTypes.includes(file.type.toLowerCase());
  };

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  // Handle drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!editor) return;

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(isImageFile);

    if (imageFiles.length === 0) {
      return; // No supported image files
    }

    // Process each image file
    for (const file of imageFiles) {
      try {
        const base64 = await fileToBase64(file);
        
        // Insert image at current cursor position
        editor.chain().focus().setImage({ 
          src: base64,
          alt: file.name,
          title: file.name
        }).run();
      } catch (error) {
        console.error('Error processing image file:', error);
      }
    }
  }, [editor]);

  if (!editor) {
    return null
  }

  return (
    <div 
      className={`relative ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 border-2 border-dashed border-blue-300 rounded-lg z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="text-blue-600 text-lg font-medium mb-2">
              Drop images here
            </div>
            <div className="text-blue-500 text-sm">
              Supports JPEG, JPG, and PNG files
            </div>
          </div>
        </div>
      )}
      
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none px-8 pb-8 focus:outline-none min-h-[400px]"
      />
    </div>
  );
}; 