import React, { useState, useRef, useEffect } from 'react'
import { searchWithContext, getPerplexityClient } from '../utils/perplexity-search'
import { 
  X, 
  Search,
  Send,
  Copy,
  RotateCcw,
  ExternalLink,
  Plus,
  Sparkles,
  Globe,
  BookOpen,
  Newspaper,
  Code2
} from 'lucide-react'

interface Message {
  type: 'user' | 'assistant'
  content: string
  sources?: Array<{
    url: string
    title?: string
  }>
  timestamp: number
}

interface SearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onInsertToNote?: (text: string) => void
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose, onInsertToNote }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchContext, setSearchContext] = useState<'general' | 'research' | 'news' | 'technical'>('general')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isApiKeyConfigured = !!getPerplexityClient()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    if (!isApiKeyConfigured) {
      alert('Please configure your Perplexity API key in Settings to use search features')
      return
    }

    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const result = await searchWithContext(input, searchContext)

      const responseMessage: Message = {
        type: 'assistant',
        content: result.success ? result.content! : `Error: ${result.error}`,
        sources: result.sources || [],
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, responseMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        type: 'assistant',
        content: `Error: ${error.message || 'Unknown error occurred'}`,
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // Could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const clearMessages = () => {
    setMessages([])
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  }

  const searchContexts = [
    { key: 'general' as const, label: 'General', icon: Globe, color: 'text-blue-600' },
    { key: 'research' as const, label: 'Research', icon: BookOpen, color: 'text-purple-600' },
    { key: 'news' as const, label: 'News', icon: Newspaper, color: 'text-green-600' },
    { key: 'technical' as const, label: 'Technical', icon: Code2, color: 'text-orange-600' },
  ]

  const suggestions = [
    'Latest AI developments',
    'Current weather forecast',
    'Stock market trends',
    'Technology news today',
    'Best practices for React',
    'Climate change updates'
  ]

  return (
    <div className={`
      fixed right-0 top-0 h-full w-[450px] bg-white shadow-2xl transform transition-transform duration-300 z-50 border-l border-gray-200
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-sm">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Web Search</h2>
              <p className="text-xs text-gray-500">Powered by Perplexity</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Clear conversation"
              >
                <RotateCcw className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Search Context Selector */}
        <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="flex gap-1">
            {searchContexts.map((context) => (
              <button
                key={context.key}
                onClick={() => setSearchContext(context.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  searchContext === context.key
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                <context.icon className={`w-3.5 h-3.5 ${context.color}`} />
                {context.label}
              </button>
            ))}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-500" />
              </div>
              <p className="text-gray-900 font-medium mb-2">Search the web with AI</p>
              <p className="text-sm text-gray-500 mb-6">Get current information and insights from across the internet</p>
              
              {isApiKeyConfigured ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-medium">Try searching for:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(suggestion)}
                        className="px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>API Key Required:</strong> Configure your Perplexity API key in Settings to use search features.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    max-w-[85%] rounded-2xl px-4 py-3 shadow-sm
                    ${msg.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                      : 'bg-gray-50 text-gray-800 border border-gray-200'}
                  `}>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-2 font-medium">Sources:</p>
                        <div className="space-y-1">
                          {msg.sources.map((source, i) => (
                            <a
                              key={i}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{source.title || source.url}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3">
                      <p className={`text-xs ${
                        msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                      {msg.type === 'assistant' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => copyToClipboard(msg.content)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          {onInsertToNote && (
                            <button
                              onClick={() => onInsertToNote(msg.content)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Insert to note"
                            >
                              <Plus className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-600">Searching the web...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleSearch} className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isApiKeyConfigured ? "Search for anything..." : "Configure API key in Settings first"}
              disabled={isLoading || !isApiKeyConfigured}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-100 text-sm"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !isApiKeyConfigured}
              className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 