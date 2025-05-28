import React, { useState } from 'react'
import { 
  Settings, X, User, Key, Database, Info, 
  LogOut, Eye, EyeOff, AlertTriangle, Check,
  RefreshCw, Trash2
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { encryptData, decryptData } from '../services/encryption'
import { signOutUser, auth } from '../services/firebase'
import { validateApiKey } from '../services/openai-service'

interface SettingsPanelProps {
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  userEmail: string
  onSignOut: () => void
  onResetApp: () => void
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen: externalIsOpen,
  onOpenChange: externalOnOpenChange,
  userEmail, 
  onSignOut, 
  onResetApp 
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalOnOpenChange || setInternalIsOpen
  const [activeTab, setActiveTab] = useState<'account' | 'api' | 'data' | 'about'>('account')
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [showChatGPTApiKey, setShowChatGPTApiKey] = useState(false)
  const [showPerplexityApiKey, setShowPerplexityApiKey] = useState(false)
  const [newChatGPTApiKey, setNewChatGPTApiKey] = useState('')
  const [newPerplexityApiKey, setNewPerplexityApiKey] = useState('')
  const [isUpdatingChatGPTApiKey, setIsUpdatingChatGPTApiKey] = useState(false)
  const [isUpdatingPerplexityApiKey, setIsUpdatingPerplexityApiKey] = useState(false)
  const [chatGPTApiKeyUpdateSuccess, setChatGPTApiKeyUpdateSuccess] = useState(false)
  const [perplexityApiKeyUpdateSuccess, setPerplexityApiKeyUpdateSuccess] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Get current user data from Firebase auth
  const currentUser = auth?.currentUser
  const photoURL = currentUser?.photoURL
  const displayName = currentUser?.displayName

  // Get current ChatGPT API key (masked)
  const getCurrentChatGPTApiKey = () => {
    const encryptedKey = localStorage.getItem('encryptedChatGPTApiKey')
    if (!encryptedKey) return 'Not configured'
    
    try {
      const decryptedKey = decryptData(encryptedKey)
      if (decryptedKey.length > 10) {
        return `${decryptedKey.substring(0, 7)}...${decryptedKey.substring(decryptedKey.length - 4)}`
      }
      return 'Invalid key'
    } catch {
      return 'Invalid key'
    }
  }

  // Get current Perplexity API key (masked)
  const getCurrentPerplexityApiKey = () => {
    const encryptedKey = localStorage.getItem('encryptedPerplexityApiKey')
    if (!encryptedKey) return 'Not configured'
    
    try {
      const decryptedKey = decryptData(encryptedKey)
      if (decryptedKey.length > 10) {
        return `${decryptedKey.substring(0, 7)}...${decryptedKey.substring(decryptedKey.length - 4)}`
      }
      return 'Invalid key'
    } catch {
      return 'Invalid key'
    }
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOutUser()
      setIsOpen(false)
      onSignOut()
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  const handleUpdateChatGPTApiKey = async () => {
    if (!newChatGPTApiKey.trim()) return
    
    try {
      setIsUpdatingChatGPTApiKey(true)
      
      // Validate API key with GPT-4o
      const validation = await validateApiKey(newChatGPTApiKey.trim())
      
      if (!validation.success) {
        throw new Error(validation.details)
      }
      
      // Encrypt and save
      const encrypted = encryptData(newChatGPTApiKey.trim())
      localStorage.setItem('encryptedChatGPTApiKey', encrypted)
      
      setChatGPTApiKeyUpdateSuccess(true)
      setNewChatGPTApiKey('')
      
      // Hide success message after 3 seconds
      setTimeout(() => setChatGPTApiKeyUpdateSuccess(false), 3000)
    } catch (error) {
      console.error('ChatGPT API key update error:', error)
      alert(`Failed to update ChatGPT API key: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUpdatingChatGPTApiKey(false)
    }
  }

  const handleUpdatePerplexityApiKey = async () => {
    if (!newPerplexityApiKey.trim()) return
    
    try {
      setIsUpdatingPerplexityApiKey(true)
      
      // Basic validation
      if (!newPerplexityApiKey.startsWith('pplx-')) {
        throw new Error('Perplexity API key must start with "pplx-"')
      }
      
      // Encrypt and save
      const encrypted = encryptData(newPerplexityApiKey.trim())
      localStorage.setItem('encryptedPerplexityApiKey', encrypted)
      
      setPerplexityApiKeyUpdateSuccess(true)
      setNewPerplexityApiKey('')
      
      // Hide success message after 3 seconds
      setTimeout(() => setPerplexityApiKeyUpdateSuccess(false), 3000)
    } catch (error) {
      console.error('Perplexity API key update error:', error)
      alert(`Failed to update Perplexity API key: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsUpdatingPerplexityApiKey(false)
    }
  }

  const handleResetApp = async () => {
    if (resetConfirmation !== 'RESET') return
    
    try {
      setIsResetting(true)
      
      // Clear all localStorage
      localStorage.clear()
      
      // Sign out user
      await signOutUser()
      
      setIsOpen(false)
      onResetApp()
    } catch (error) {
      console.error('Reset error:', error)
      setIsResetting(false)
    }
  }

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'api' as const, label: 'API Keys', icon: Key },
    { id: 'data' as const, label: 'Data', icon: Database },
    { id: 'about' as const, label: 'About', icon: Info },
  ]

  // If used as a standalone component, render the trigger button
  if (externalIsOpen === undefined) {
    return (
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <button className="btn-secondary w-full">
            <Settings size={14} />
            Settings
          </button>
        </Dialog.Trigger>
        {/* Modal content would go here for standalone use */}
      </Dialog.Root>
    )
  }

  // If controlled externally, just render the modal
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                                 w-full max-w-2xl max-h-[90vh] bg-white rounded-lg shadow-xl z-[101]
                                 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#D2D2D7]">
            <Dialog.Title className="text-apple-title-sm">
              Settings
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors duration-200">
                <X size={16} className="text-[#86868B]" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex h-[500px]">
            {/* Sidebar */}
            <div className="w-48 bg-[#F5F5F7] border-r border-[#D2D2D7] p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                               transition-colors duration-150 ${
                                 activeTab === tab.id
                                   ? 'bg-white border border-[#E5E5E7] text-gray-900 font-medium'
                                   : 'text-gray-600 hover:bg-white/50'
                               }`}
                    >
                      <Icon size={16} />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                    
                    <div className="bg-[#FAFAFA] rounded-lg p-4 border border-[#E5E5E7]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          {photoURL && !imageError ? (
                            <img
                              src={photoURL}
                              alt={displayName || userEmail}
                              className="w-full h-full object-cover"
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 
                                          flex items-center justify-center">
                              <User size={20} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">Signed in with Google</p>
                          {displayName && (
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {displayName}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 truncate" title={userEmail}>
                            {userEmail}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Actions</h4>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 
                               rounded-lg hover:bg-red-100 transition-colors duration-150
                               disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut size={16} />
                      {isSigningOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">API Configuration</h3>
                    
                    <div className="space-y-6">
                      {/* ChatGPT API Key Section */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-900">ChatGPT API Key</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current ChatGPT API Key
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E7] 
                                          rounded-lg text-sm text-gray-600 font-mono">
                              {getCurrentChatGPTApiKey()}
                            </div>
                            {chatGPTApiKeyUpdateSuccess && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Check size={16} />
                                <span className="text-sm">Updated</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Update ChatGPT API Key
                          </label>
                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                type={showChatGPTApiKey ? 'text' : 'password'}
                                value={newChatGPTApiKey}
                                onChange={(e) => setNewChatGPTApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg
                                         focus:border-blue-500 focus:outline-none text-sm font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setShowChatGPTApiKey(!showChatGPTApiKey)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2
                                         text-gray-400 hover:text-gray-600"
                              >
                                {showChatGPTApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            
                            <button
                              onClick={handleUpdateChatGPTApiKey}
                              disabled={!newChatGPTApiKey.trim() || isUpdatingChatGPTApiKey}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                                       rounded-lg hover:bg-blue-700 transition-colors duration-150
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdatingChatGPTApiKey ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Key size={16} />
                              )}
                              {isUpdatingChatGPTApiKey ? 'Updating...' : 'Update ChatGPT API Key'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Perplexity API Key Section */}
                      <div className="space-y-4">
                        <h4 className="text-md font-medium text-gray-900">Perplexity API Key</h4>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Perplexity API Key
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 px-3 py-2 bg-[#FAFAFA] border border-[#E5E5E7] 
                                          rounded-lg text-sm text-gray-600 font-mono">
                              {getCurrentPerplexityApiKey()}
                            </div>
                            {perplexityApiKeyUpdateSuccess && (
                              <div className="flex items-center gap-1 text-green-600">
                                <Check size={16} />
                                <span className="text-sm">Updated</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Update Perplexity API Key
                          </label>
                          <div className="space-y-3">
                            <div className="relative">
                              <input
                                type={showPerplexityApiKey ? 'text' : 'password'}
                                value={newPerplexityApiKey}
                                onChange={(e) => setNewPerplexityApiKey(e.target.value)}
                                placeholder="pplx-..."
                                className="w-full px-3 py-2 border border-[#E5E5E7] rounded-lg
                                         focus:border-blue-500 focus:outline-none text-sm font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPerplexityApiKey(!showPerplexityApiKey)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2
                                         text-gray-400 hover:text-gray-600"
                              >
                                {showPerplexityApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            
                            <button
                              onClick={handleUpdatePerplexityApiKey}
                              disabled={!newPerplexityApiKey.trim() || isUpdatingPerplexityApiKey}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                                       rounded-lg hover:bg-blue-700 transition-colors duration-150
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isUpdatingPerplexityApiKey ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <Key size={16} />
                              )}
                              {isUpdatingPerplexityApiKey ? 'Updating...' : 'Update Perplexity API Key'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            <p className="font-medium mb-1">Security Note</p>
                            <p>Your API keys are encrypted and stored locally in your browser. They never leave your device.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Data Management</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertTriangle size={20} className="text-red-600 flex-shrink-0" />
                          <div>
                            <h4 className="text-md font-medium text-red-900 mb-2">Reset Everything</h4>
                            <p className="text-sm text-red-800 mb-4">
                              This will permanently delete all your settings, sign you out, and reset the app 
                              to its initial state. This action cannot be undone.
                            </p>
                            
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-red-900 mb-2">
                                  Type "RESET" to confirm:
                                </label>
                                <input
                                  type="text"
                                  value={resetConfirmation}
                                  onChange={(e) => setResetConfirmation(e.target.value)}
                                  placeholder="RESET"
                                  className="w-full px-3 py-2 border border-red-300 rounded-lg
                                           focus:border-red-500 focus:outline-none text-sm"
                                />
                              </div>
                              
                              <button
                                onClick={handleResetApp}
                                disabled={resetConfirmation !== 'RESET' || isResetting}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white 
                                         rounded-lg hover:bg-red-700 transition-colors duration-150
                                         disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isResetting ? (
                                  <RefreshCw size={16} className="animate-spin" />
                                ) : (
                                  <Trash2 size={16} />
                                )}
                                {isResetting ? 'Resetting...' : 'Reset Everything'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">About Clarity</h3>
                    
                    <div className="space-y-4">
                      <div className="bg-[#FAFAFA] rounded-lg p-4 border border-[#E5E5E7]">
                        <h4 className="font-medium text-gray-900 mb-2">Version</h4>
                        <p className="text-sm text-gray-600">1.0.0</p>
                      </div>
                      
                      <div className="bg-[#FAFAFA] rounded-lg p-4 border border-[#E5E5E7]">
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">
                          A modern, secure note-taking application with AI-powered features and 
                          Firebase synchronization.
                        </p>
                      </div>
                      
                      <div className="bg-[#FAFAFA] rounded-lg p-4 border border-[#E5E5E7]">
                        <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• Real-time synchronization with Firebase</li>
                          <li>• AI-powered content generation with ChatGPT</li>
                          <li>• Enhanced search and research with Perplexity AI</li>
                          <li>• Secure local encryption for API keys</li>
                          <li>• Project and folder organization</li>
                          <li>• Rich text and Markdown support</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
} 