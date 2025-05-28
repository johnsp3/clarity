# Format Transformation System Guide

## Overview

The Clarity app's format transformation system allows users to convert their content to beautiful Markdown format using AI-powered transformation. This guide explains how the system works and how to use it effectively.

## The Two-Window System

### 1. **Content Window (Left)**
- Shows the **raw format** of your content
- This is where you edit and see the actual code/syntax
- For Markdown: Shows `# Headers`, `**bold**`, `- lists`

### 2. **Preview Window (Right)**
- Shows the **beautifully rendered** version of your content
- Automatically opens when you use format transformation
- Renders markdown as beautiful HTML with proper styling

## Available Format

### Beautiful Markdown Format ✨
- **What it does**: Transforms any text into beautifully formatted Markdown
- **Content Window**: Shows raw markdown syntax (headers, bold, lists, etc.)
- **Preview Window**: Renders the markdown as styled HTML
- **Use cases**: 
  - Creating documentation
  - Writing README files
  - Formatting notes with structure

## How It Works

1. **Select your content** in the editor
2. **Click AI Edit** button
3. **Choose "Beautiful Markdown Format"** from the presets
4. **Wait for transformation** (usually 2-3 seconds)
5. **Results**:
   - Content window updates to show raw markdown
   - Preview window automatically opens
   - Format badge shows "Markdown Format"

## Example Transformation

**Input (Plain Text):**
```
GitHub Security Reminder

The first step is GitHub, and we need to ensure that we don't commit our ChatGPT API key to the repository.

Non-Negotiables:
- ChatGPT API Integration
- EnhancedTextRenderer.swift
- Core UI/UX
```

**Output (Markdown in Content Window):**
```markdown
# 🔒 GitHub Security Reminder

The first step is GitHub, and we need to ensure that we **don't commit our ChatGPT API key** to the repository.

## 📋 Non-Negotiables

- **ChatGPT API Integration** - Core to app functionality
- **EnhancedTextRenderer.swift** - Rendering/text pipeline must remain untouched
- **Core UI/UX** - The app's look and feel should stay consistent
```

**Preview Window Shows:**
- Styled heading with emoji
- Bold emphasized text
- Properly formatted list with descriptions
- Clean, readable layout

## Error Handling

The system includes comprehensive error handling:

- **Empty content**: Shows alert "No content to transform"
- **API errors**: Displays clear error message
- **Parsing errors**: Shows error in preview with details
- **Network issues**: Preserves original content

## Tips for Best Results

1. **Clear structure**: Use clear sections and lists in your input
2. **Meaningful content**: The AI works best with well-structured text
3. **Check preview**: Always verify the preview looks correct
4. **Save regularly**: The transformed content is automatically saved

## Technical Details

- Uses OpenAI GPT-4 for transformations
- Markdown parsing via `marked` library
- Real-time preview updates
- Automatic format detection
- Console logging for debugging

## Troubleshooting

If the transformation isn't working:

1. Check your API key is configured
2. Ensure you have content selected
3. Look for error messages in the preview
4. Check browser console for detailed logs
5. Try refreshing the page

## Console Logs

When debugging, look for these log patterns:
```
🎯 [RichTextEditor] AI transformation received
📝 [RichTextEditor] Updating content for markdown transformation
✅ [RichTextEditor] Content updated in editor
🎨 [ContentPreview] Rendering content as format: markdown
✅ [ContentPreview] Markdown successfully rendered
``` 