import React, { useState, useRef, useEffect } from 'react'
import { transformText, isApiAvailable, getModelInfo, validateApiKey } from '../services/openai-service'
import { decryptData } from '../services/encryption'
import { 
  announceToScreenReader,
  createAriaLabel,
  trapFocus,
  FocusManager
} from '../utils/accessibility'
import { 
  Sparkles,
  ChevronDown,
  Smile,
  Briefcase,
  Scissors,
  CheckCircle,
  Edit3,
  Zap,
  List,
  FileDown,
  Lightbulb,
  Target,
  Hash,
  Code,
  FileText,
  Loader2,
  TestTube
} from 'lucide-react'

interface AIEditProps {
  content: string
  onRewrite: (newContent: string, format?: string) => void
}

export const AIEdit: React.FC<AIEditProps> = ({ content, onRewrite }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [recentPrompts, setRecentPrompts] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState<'tone' | 'enhance' | 'custom' | 'test' | 'presets'>('presets')
  const [lastUsage, setLastUsage] = useState<{ prompt_tokens: number; completion_tokens: number; total_tokens: number } | null>(null)
  const [testResult, setTestResult] = useState<string>('')
  const [focusedItemIndex, setFocusedItemIndex] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const focusManager = useRef(new FocusManager())

  const isApiKeyConfigured = isApiAvailable()
  const modelInfo = getModelInfo()

  useEffect(() => {
    // Load recent prompts from localStorage
    const saved = localStorage.getItem('recentCustomPrompts')
    if (saved) {
      try {
        setRecentPrompts(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load recent prompts:', error)
      }
    } else {
      // Set default prompts if none exist
      const defaultPrompts = [
        'Make this into a beautiful markdown format',
        'Convert to professional documentation format',
        'Format as a technical specification'
      ]
      setRecentPrompts(defaultPrompts)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      focusManager.current.saveFocus()
      const cleanup = trapFocus(dropdownRef.current)
      return cleanup
    } else {
      focusManager.current.restoreFocus()
    }
  }, [isOpen])

  const saveRecentPrompt = (prompt: string) => {
    if (!prompt.trim()) return
    
    const updated = [prompt, ...recentPrompts.filter(p => p !== prompt)].slice(0, 5)
    setRecentPrompts(updated)
    localStorage.setItem('recentCustomPrompts', JSON.stringify(updated))
  }

  const testApiConnection = async () => {
    if (!isApiKeyConfigured) {
      setTestResult('❌ No API key configured')
      announceToScreenReader('No API key configured')
      return
    }

    setIsTesting(true)
    setTestResult('🧪 Testing API connection...')
    announceToScreenReader('Testing API connection')

    try {
      // Get the API key from localStorage
      const encryptedKey = localStorage.getItem('encryptedChatGPTApiKey')
      if (!encryptedKey) {
        setTestResult('❌ No API key found in storage')
        announceToScreenReader('No API key found in storage')
        return
      }

      const apiKey = decryptData(encryptedKey)

      console.log('🧪 [Test] Starting API validation test')
      
      // Test API key validation
      const validation = await validateApiKey(apiKey)
      
      if (validation.success) {
        setTestResult(`✅ API Connection Successful!\n${validation.details}`)
        announceToScreenReader('API connection successful')
        
        // Now test a simple transformation
        console.log('🧪 [Test] Testing text transformation')
        const testContent = "Hello world"
        const result = await transformText(testContent, "happy")
        
        if (result.success) {
          setTestResult(`✅ Full Test Successful!\n✓ API Connected: ${validation.message}\n✓ Transformation: "${result.content}"\n✓ Tokens used: ${result.usage?.total_tokens || 'N/A'}`)
          announceToScreenReader('Full test successful')
        } else {
          setTestResult(`⚠️ API Connected but transformation failed:\n${result.error}`)
          announceToScreenReader('API connected but transformation failed')
        }
      } else {
        setTestResult(`❌ API Connection Failed:\n${validation.details}`)
        announceToScreenReader('API connection failed')
      }
    } catch (error) {
      console.error('🧪 [Test] API test failed:', error)
      const err = error as Error
      setTestResult(`❌ Test Failed:\n${err.message}`)
      announceToScreenReader('Test failed')
    } finally {
      setIsTesting(false)
    }
  }

  const handleTransform = async (transformation: string, customPrompt?: string) => {
    if (!content.trim()) {
      alert('No content to transform')
      announceToScreenReader('No content to transform')
      return
    }

    if (!isApiKeyConfigured) {
      alert('Please configure your OpenAI API key in Settings to use AI features.')
      announceToScreenReader('API key required')
      return
    }

    setIsLoading(true)
    setIsOpen(false)
    announceToScreenReader(`Transforming text with ${transformation}`)

    try {
      console.log(`🚀 [AIEdit] Starting transformation: ${transformation}`)
      
      // Check if the custom prompt is asking for beautiful markdown format
      if (customPrompt && customPrompt.toLowerCase().includes('beautiful markdown format')) {
        transformation = 'markdown'
        customPrompt = undefined // Use the predefined markdown transformation
      }
      
      const result = await transformText(content, transformation, customPrompt)

      if (result.success && result.content) {
        console.log(`✅ [AIEdit] Transformation successful: ${transformation}`)
        announceToScreenReader('Transformation successful')
        
        // For Markdown transformations, show both the rendered result and offer to view source
        if (transformation === 'markdown' || (customPrompt && customPrompt.toLowerCase().includes('markdown'))) {
          console.log('🎯 [AIEdit] Markdown transformation detected - showing rendered result')
          console.log('📝 [AIEdit] Raw Markdown source:', result.content)
        }
        
        onRewrite(result.content, transformation)
        
        // Save usage stats
        if (result.usage) {
          setLastUsage(result.usage)
        }

        // Save custom prompt to recent prompts
        if (customPrompt) {
          saveRecentPrompt(customPrompt)
          setCustomPrompt('')
        }
      } else {
        console.error(`❌ [AIEdit] Transformation failed: ${result.error}`)
        alert(`AI transformation failed: ${result.error}`)
        announceToScreenReader('Transformation failed')
      }
    } catch (error) {
      console.error('❌ [AIEdit] Unexpected error:', error)
      const err = error as Error
      alert(`Unexpected error: ${err.message}`)
      announceToScreenReader('Unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const menuItems = {
    tone: [
      { key: 'happy', label: 'Make it Happy', icon: Smile, emoji: '😊' },
      { key: 'professional', label: 'Make it Professional', icon: Briefcase, emoji: '💼' },
      { key: 'grammar', label: 'Fix Grammar & Spelling', icon: CheckCircle, emoji: '✓' }
    ],
    enhance: [
      { key: 'concise', label: 'Make it Concise', icon: Scissors, emoji: '✂️' },
      { key: 'expand', label: 'Expand with Details', icon: Zap, emoji: '⚡' },
      { key: 'bullets', label: 'Convert to Bullets', icon: List, emoji: '📝' },
      { key: 'summarize', label: 'Summarize', icon: FileDown, emoji: '📄' },
      { key: 'improve', label: 'Improve Clarity', icon: Lightbulb, emoji: '💡' },
      { key: 'simplify', label: 'Simplify Language', icon: Target, emoji: '🎯' }
    ],
    presets: [
      { key: 'markdown', label: 'Beautiful Markdown Format', icon: Hash, emoji: '✨' },
      { key: 'plain', label: 'Beautiful Plain Text Format', icon: FileText, emoji: '📄' },
      { key: 'beautifulhtml', label: 'Beautiful HTML Format', icon: Code, emoji: '🎨' }
    ]
  }

  const categories = [
    { key: 'presets' as const, label: 'Presets', icon: Hash },
    { key: 'tone' as const, label: 'Tone & Style', icon: Smile },
    { key: 'enhance' as const, label: 'Enhance', icon: Zap },
    { key: 'custom' as const, label: 'Custom', icon: Edit3 },
    { key: 'test' as const, label: 'Test', icon: TestTube }
  ]

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ease-out
          ${isApiKeyConfigured 
            ? 'bg-[#F5F5F7] text-[#1D1D1F] border border-[#D2D2D7] hover:bg-[#E8E8ED] hover:border-[#C7C7CC] active:scale-[0.97] active:bg-[#E8E8ED]' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
          ${isLoading ? 'opacity-50 cursor-wait' : ''}
        `}
        aria-label={isLoading ? 'AI transformation in progress' : 'Open AI text editor menu'}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-disabled={!isApiKeyConfigured || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
            <span>Transforming...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-[#1D1D1F]" aria-hidden="true" />
            <span>AI Edit</span>
            <ChevronDown className="w-3 h-3 text-[#1D1D1F]" aria-hidden="true" />
          </>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute top-full right-full mr-2 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-[#E5E5E7] z-50 overflow-hidden"
          role="menu"
          aria-label="AI text transformation options"
        >
          {/* Header with model info */}
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900" id="ai-edit-title">AI Text Editor</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Powered by {modelInfo.primaryModel}
                </p>
              </div>
              <Sparkles className="w-6 h-6 text-blue-500" aria-hidden="true" />
            </div>
            
            {lastUsage && (
              <div className="mt-2 text-xs text-gray-500" aria-live="polite">
                Last usage: {lastUsage.total_tokens} tokens
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-gray-100" role="tablist" aria-label="Transformation categories">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => {
                  setActiveCategory(category.key)
                  setFocusedItemIndex(0)
                }}
                className={`flex-1 px-2 py-3 text-xs font-medium transition-colors ${
                  activeCategory === category.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                role="tab"
                aria-selected={activeCategory === category.key}
                aria-controls={`${category.key}-panel`}
                id={`${category.key}-tab`}
              >
                <div className="flex flex-col items-center justify-center gap-1">
                  <category.icon className="w-3 h-3" aria-hidden="true" />
                  <span className="text-xs whitespace-nowrap">{category.label}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {activeCategory === 'test' ? (
              <div 
                className="p-5 space-y-4"
                role="tabpanel"
                id="test-panel"
                aria-labelledby="test-tab"
              >
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">API Connection Test</h4>
                  <p className="text-xs text-gray-600 mb-4">
                    Test your ChatGPT API connection and verify GPT-4o access.
                  </p>
                  
                  <button
                    onClick={testApiConnection}
                    disabled={isTesting}
                    className="w-full px-4 py-3 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    aria-label="Test API connection"
                    aria-busy={isTesting}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4" aria-hidden="true" />
                        Test API Connection
                      </>
                    )}
                  </button>
                  
                  {testResult && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg" role="status" aria-live="polite">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                        {testResult}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : activeCategory === 'custom' ? (
              <div 
                className="p-5 space-y-4"
                role="tabpanel"
                id="custom-panel"
                aria-labelledby="custom-tab"
              >
                <div>
                  <label htmlFor="custom-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Instructions
                  </label>
                  <textarea
                    id="custom-prompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="e.g., Make this into a beautiful markdown format..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:border-blue-500 focus:outline-none"
                    rows={3}
                    aria-describedby="custom-prompt-hint"
                  />
                  <span id="custom-prompt-hint" className="sr-only">
                    Enter custom instructions for AI transformation
                  </span>
                </div>

                {recentPrompts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2" id="recent-prompts-label">
                      Recent Prompts
                    </label>
                    <div className="space-y-1" role="list" aria-labelledby="recent-prompts-label">
                      {recentPrompts.map((prompt, index) => (
                        <button
                          key={index}
                          onClick={() => setCustomPrompt(prompt)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                          role="listitem"
                          aria-label={`Use recent prompt: ${prompt}`}
                        >
                          {prompt.length > 60 ? `${prompt.substring(0, 60)}...` : prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleTransform('custom', customPrompt)}
                  disabled={!customPrompt.trim()}
                  className="w-full px-4 py-3 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Apply custom transformation prompt"
                  aria-disabled={!customPrompt.trim()}
                >
                  Apply Custom Prompt
                </button>
              </div>
            ) : activeCategory === 'presets' ? (
              <div 
                className="py-2"
                role="tabpanel"
                id="presets-panel"
                aria-labelledby="presets-tab"
              >
                <div className="px-5 py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-600">Quick access to popular formatting presets</p>
                </div>
                <div role="menu">
                  {menuItems.presets?.map((item, index) => (
                    <button
                      key={item.key}
                      onClick={() => handleTransform(item.key)}
                      className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-4 transition-colors focus:bg-gray-50 focus:outline-none"
                      role="menuitem"
                      aria-label={createAriaLabel('Transform text to', item.label)}
                      tabIndex={focusedItemIndex === index ? 0 : -1}
                    >
                      <item.icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.emoji && <span className="text-lg" aria-hidden="true">{item.emoji}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div 
                className="py-2"
                role="tabpanel"
                id={`${activeCategory}-panel`}
                aria-labelledby={`${activeCategory}-tab`}
              >
                <div role="menu">
                  {menuItems[activeCategory]?.map((item, index) => (
                    <button
                      key={item.key}
                      onClick={() => handleTransform(item.key)}
                      className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-4 transition-colors focus:bg-gray-50 focus:outline-none"
                      role="menuitem"
                      aria-label={createAriaLabel('Transform text to', item.label)}
                      tabIndex={focusedItemIndex === index ? 0 : -1}
                    >
                      <item.icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.emoji && <span className="text-lg" aria-hidden="true">{item.emoji}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isApiKeyConfigured && (
            <div className="px-5 py-4 border-t border-gray-100">
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg" role="alert">
                <strong>API Key Required:</strong> Configure your OpenAI API key in Settings to use AI features.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 