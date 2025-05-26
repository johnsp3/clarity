import { useState, useEffect } from 'react';
import SetupWizard from './components/SetupWizard';
// @ts-expect-error - JavaScript module
import { isFirebaseConfigured, reinitializeFirebase, signInWithGoogle, auth } from './services/firebase.js';
import { EnhancedSidebar } from './components/EnhancedSidebar'
import { EnhancedNoteList } from './components/EnhancedNoteList'
import { Editor } from './components/Editor'
import { CommandPalette } from './components/CommandPalette'

import { SearchPanel } from './components/SearchPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { ImportManager } from './components/ImportManager'

import { useStore } from './store/useStore'
import { onAuthStateChanged } from 'firebase/auth'
import { Search, Download, Upload, Settings } from 'lucide-react'

function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);


  const loadDataFromFirebase = useStore(state => state.loadDataFromFirebase);
  const isLoadingData = useStore(state => state.isLoading);
  const updateNote = useStore(state => state.updateNote);
  const activeNote = useStore(state => state.activeNote);
  const addNote = useStore(state => state.addNote);
  const setCommandPaletteOpen = useStore(state => state.setCommandPaletteOpen);
  const notes = useStore(state => state.notes);

  useEffect(() => {
    // Check for reset parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'true') {
      console.log('Resetting app configuration...');
      localStorage.clear();
      // Remove the reset parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check if app is configured
    const configured = isFirebaseConfigured();
    console.log('App initialization - isConfigured:', configured);
    setIsConfigured(configured);
    setLoading(false); // Initial config check is done
    
    if (configured) {
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user?.email);
        
        if (user) {
          setIsAuthenticated(true);
          setCurrentUser(user);
          setAuthLoading(false);
          // Load data from Firebase when user is authenticated
          try {
            await loadDataFromFirebase();
          } catch (error) {
            console.error('Failed to load data:', error);
          }
        } else {
          setIsAuthenticated(false);
          setCurrentUser(null);
          setAuthLoading(false);
        }
      });
      
      return () => unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, [loadDataFromFirebase]);

  const handleSetupComplete = () => {
    // Reinitialize Firebase with new config
    reinitializeFirebase();
    setIsConfigured(true);
    // Reload the page to ensure clean initialization
    window.location.reload();
  };

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      const user = await signInWithGoogle();
      console.log('Sign in successful:', user.email);
      // The onAuthStateChanged listener will handle the rest
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthLoading(false);
      
      // Check for specific error types
      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need to show error
        return;
      }
      
      // Show error to user
      alert(error?.message || 'Sign in failed');
    }
  };

  const handleSignOut = () => {
    // The auth state listener will handle the state updates
    // Just reload to ensure clean state
    window.location.reload();
  };

  const handleCreateNote = () => {
    addNote({
      title: 'Untitled Note',
      content: '',
      projectId: null,
      folderId: null,
      tags: [],
      type: 'markdown',
      hasImages: false,
      hasCode: false,
      format: 'markdown',
    });
  };

  const handleExportNotes = () => {
    try {
      const dataStr = JSON.stringify(notes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clarity-notes-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export notes. Please try again.');
    }
  };

  const handleResetApp = () => {
    window.location.href = '/?reset=true';
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!isConfigured) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-100">Welcome to Clarity</h1>
            <p className="text-gray-400">Please sign in to access your notes</p>
          </div>
          
          <button
            onClick={handleSignIn}
            disabled={authLoading}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              authLoading 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 hover:scale-105'
            }`}
          >
            {authLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
          
          <div className="text-sm text-gray-500 space-y-2">
            <p>Make sure pop-ups are allowed for this site</p>
          </div>
          
          {/* Troubleshooting button */}
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-gray-500 hover:text-gray-400 underline"
          >
            Having trouble? Click here to refresh
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading your notes...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <EnhancedSidebar 
        onShowSearch={() => setShowSearch(true)}
        userEmail={currentUser?.email || ''}
        onSignOut={handleSignOut}
      />
      <EnhancedNoteList />
      <div className="flex-1 flex flex-col">
        {/* Apple-style Top Navigation Bar */}
        <div className="h-[52px] bg-white border-b border-[#D2D2D7] flex items-center justify-between px-8">
          <div className="flex items-center gap-8">
            <h1 className="text-apple-title-sm">Clarity</h1>
            
            {/* Integrated Search Bar */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="search-apple flex items-center gap-3"
            >
              <Search size={16} className="text-[#86868B]" />
              <span className="flex-1 text-left">Search</span>
              <span className="text-[13px] text-[#86868B]">⌘K</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="btn-apple-icon"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            
            {/* Create Button */}
            <button
              onClick={handleCreateNote}
              className="btn-apple-primary"
            >
              Create
            </button>
          </div>
        </div>
        
        {/* Editor content */}
        <div className="flex-1">
          <Editor 
            onShowImport={() => setShowImport(true)}
            onExportNotes={handleExportNotes}
          />
        </div>
      </div>
      <CommandPalette />
      <SearchPanel
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onInsertToNote={(text) => {
          const note = activeNote()
          if (note) {
            const newContent = note.content + '\n\n---\n\n' + text
            updateNote(note.id, { content: newContent })
          }
          setShowSearch(false)
        }}
      />
      <SettingsPanel 
        isOpen={showSettings}
        onOpenChange={setShowSettings}
        userEmail={currentUser?.email || ''}
        onSignOut={handleSignOut}
        onResetApp={handleResetApp}
      />
      <ImportManager 
        isOpen={showImport}
        onOpenChange={setShowImport}
      />
    </div>
  );
}

export default App; 