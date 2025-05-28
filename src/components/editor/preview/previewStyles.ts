import { ContentFormat } from '../../../types/editor'

export function getPreviewClassName(format: ContentFormat): string {
  switch (format) {
    case 'code':
      return 'font-mono text-sm'
    case 'json':
    case 'xml':
      return 'font-mono text-sm'
    case 'csv':
      return 'csv-preview'
    default:
      return 'prose prose-sm max-w-none'
  }
}

export function getPreviewStyles(): string {
  return `
    /* Enhanced ChatGPT-like Markdown Styles */
    .prose {
      color: #1A1A1A;
      line-height: 1.6;
      font-size: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    }
    
    /* Headers with better spacing and styling */
    .prose h1,
    .prose h2,
    .prose h3,
    .prose h4,
    .prose h5,
    .prose h6 {
      margin-top: 1.5em;
      margin-bottom: 0.75em;
      font-weight: 600;
      line-height: 1.25;
      color: #1A1A1A;
    }
    
    .prose h1 {
      font-size: 2em;
      margin-top: 0;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #E5E5E7;
    }
    
    .prose h2 {
      font-size: 1.5em;
      padding-bottom: 0.3em;
      border-bottom: 1px solid #E5E5E7;
    }
    
    .prose h3 {
      font-size: 1.25em;
    }
    
    .prose h4 {
      font-size: 1em;
    }
    
    .prose h5 {
      font-size: 0.875em;
    }
    
    .prose h6 {
      font-size: 0.85em;
      color: #6B6B6B;
    }
    
    /* Paragraphs */
    .prose p {
      margin-top: 0;
      margin-bottom: 1em;
      color: #1A1A1A;
    }
    
    /* Lists with better spacing */
    .prose ul,
    .prose ol {
      margin-top: 0;
      margin-bottom: 1em;
      padding-left: 2em;
    }
    
    .prose li {
      margin-bottom: 0.25em;
      color: #1A1A1A;
    }
    
    .prose li > p {
      margin-bottom: 0.25em;
    }
    
    .prose li::marker {
      color: #6B6B6B;
    }
    
    /* Nested lists */
    .prose ul ul,
    .prose ul ol,
    .prose ol ul,
    .prose ol ol {
      margin-top: 0.25em;
      margin-bottom: 0.25em;
    }
    
    /* Task lists (checkboxes) */
    .prose input[type="checkbox"] {
      -webkit-appearance: none;
      appearance: none;
      width: 16px;
      height: 16px;
      border: 2px solid #D1D5DB;
      border-radius: 3px;
      margin-right: 0.5em;
      margin-top: 0.125em;
      vertical-align: top;
      position: relative;
      cursor: pointer;
    }
    
    .prose input[type="checkbox"]:checked {
      background-color: #2563EB;
      border-color: #2563EB;
    }
    
    .prose input[type="checkbox"]:checked::after {
      content: '';
      position: absolute;
      left: 4px;
      top: 1px;
      width: 6px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    
    .prose li:has(input[type="checkbox"]) {
      list-style: none;
      margin-left: -1.5em;
    }
    
    /* Blockquotes */
    .prose blockquote {
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #6B6B6B;
      border-left: 4px solid #E5E5E7;
      background-color: #F9FAFB;
      font-style: normal;
    }
    
    .prose blockquote p:last-child {
      margin-bottom: 0;
    }
    
    /* Code styling */
    .prose code {
      padding: 0.125em 0.25em;
      margin: 0;
      font-size: 0.875em;
      background-color: rgba(175, 184, 193, 0.2);
      border-radius: 3px;
      font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      color: #1A1A1A;
    }
    
    .prose pre {
      margin: 1em 0;
      padding: 1em;
      overflow-x: auto;
      background-color: #F6F8FA;
      border-radius: 6px;
      border: 1px solid #E5E5E7;
    }
    
    .prose pre code {
      padding: 0;
      font-size: 0.875em;
      background-color: transparent;
      border-radius: 0;
      color: #1A1A1A;
    }
    
    /* Tables */
    .prose table {
      width: 100%;
      margin: 1em 0;
      border-collapse: collapse;
      border-spacing: 0;
      overflow: auto;
    }
    
    .prose th,
    .prose td {
      padding: 0.5em 1em;
      border: 1px solid #E5E5E7;
      text-align: left;
    }
    
    .prose th {
      background-color: #F6F8FA;
      font-weight: 600;
      color: #1A1A1A;
    }
    
    .prose tr:nth-child(even) {
      background-color: #F9FAFB;
    }
    
    /* Links */
    .prose a {
      color: #2563EB;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.15s ease;
    }
    
    .prose a:hover {
      color: #1D4ED8;
      text-decoration: underline;
    }
    
    /* Images */
    .prose img {
      max-width: 100%;
      height: auto;
      margin: 1em 0;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
    
    /* Horizontal rules */
    .prose hr {
      margin: 2em 0;
      border: none;
      border-top: 1px solid #E5E5E7;
    }
    
    /* Strong and emphasis */
    .prose strong {
      font-weight: 600;
      color: #1A1A1A;
    }
    
    .prose em {
      font-style: italic;
    }
    
    /* Strikethrough */
    .prose del {
      text-decoration: line-through;
      color: #6B6B6B;
    }
    
    /* Inline code in headers */
    .prose h1 code,
    .prose h2 code,
    .prose h3 code,
    .prose h4 code,
    .prose h5 code,
    .prose h6 code {
      font-size: 0.875em;
    }
    
    /* Definition lists */
    .prose dl {
      margin: 1em 0;
    }
    
    .prose dt {
      font-weight: 600;
      margin-top: 1em;
      color: #1A1A1A;
    }
    
    .prose dd {
      margin-left: 2em;
      margin-bottom: 0.5em;
      color: #4B5563;
    }
    
    /* Keyboard input */
    .prose kbd {
      display: inline-block;
      padding: 0.125em 0.375em;
      font-size: 0.875em;
      font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      background-color: #F3F4F6;
      border: 1px solid #D1D5DB;
      border-radius: 3px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    
    /* Abbreviations */
    .prose abbr {
      text-decoration: underline dotted;
      cursor: help;
    }
    
    /* Superscript and subscript */
    .prose sup,
    .prose sub {
      font-size: 0.75em;
      line-height: 0;
      position: relative;
      vertical-align: baseline;
    }
    
    .prose sup {
      top: -0.5em;
    }
    
    .prose sub {
      bottom: -0.25em;
    }
    
    /* Mark (highlight) */
    .prose mark {
      background-color: #FEF3C7;
      color: #1A1A1A;
      padding: 0.125em 0.25em;
      border-radius: 2px;
    }
    
    /* Details/Summary */
    .prose details {
      margin: 1em 0;
      padding: 1em;
      background-color: #F9FAFB;
      border: 1px solid #E5E5E7;
      border-radius: 6px;
    }
    
    .prose summary {
      font-weight: 600;
      cursor: pointer;
      color: #1A1A1A;
    }
    
    .prose details[open] summary {
      margin-bottom: 0.5em;
    }
    
    /* Code preview specific styles */
    .code-preview {
      background-color: #F6F8FA;
      border-radius: 6px;
      padding: 1em;
      overflow-x: auto;
      font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.5;
      color: #1A1A1A;
    }
    
    /* JSON preview */
    .json-preview {
      background-color: #F6F8FA;
      border-radius: 6px;
      padding: 1em;
      overflow-x: auto;
      font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
    
    .json-preview.error {
      background-color: #FEF2F2;
      color: #991B1B;
    }
    
    /* XML preview */
    .xml-preview {
      background-color: #F6F8FA;
      border-radius: 6px;
      padding: 1em;
      overflow-x: auto;
      font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
      color: #1A1A1A;
    }
    
    /* CSV table styles */
    .csv-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
      font-size: 14px;
    }
    
    .csv-table th,
    .csv-table td {
      padding: 8px 12px;
      border: 1px solid #E5E5E7;
      text-align: left;
    }
    
    .csv-table th {
      background-color: #F6F8FA;
      font-weight: 600;
      color: #1A1A1A;
      position: sticky;
      top: 0;
    }
    
    .csv-table tr:nth-child(even) {
      background-color: #F9FAFB;
    }
    
    .csv-table tr:hover {
      background-color: #F3F4F6;
    }
    
    /* RTF content */
    .rtf-content {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1A1A1A;
    }
    
    /* DOCX content */
    .docx-content {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1A1A1A;
    }
    
    /* Error preview */
    .error-preview {
      background-color: #FEF2F2;
      color: #991B1B;
      padding: 1em;
      border-radius: 6px;
      font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.5;
    }
  `
} 