import { useState, useEffect } from 'react';
import SetupWizard from './components/SetupWizard';
import { isFirebaseConfigured, reinitializeFirebase, signInWithGoogle, auth } from './services/firebase';
import { EnhancedSidebar } from './components/EnhancedSidebar'
import { EnhancedNoteList } from './components/EnhancedNoteList'
import { Editor } from './components/Editor'
import { CommandPalette } from './components/CommandPalette'

import { SearchPanel } from './components/SearchPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { ImportManager } from './components/ImportManager'

import { useStore } from './store/useStore'
import { onAuthStateChanged } from 'firebase/auth'
import { Search, Settings, Plus } from 'lucide-react'

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
    
    if (configured && auth) {
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
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-[var(--text-secondary)] font-medium">Loading Clarity...</div>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center space-y-8 max-w-md p-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-[var(--shadow-lg)]">
              <span className="text-2xl font-bold text-white">C</span>
            </div>
            <h1 className="text-3xl font-semibold text-[var(--text-primary)]">Welcome to Clarity</h1>
            <p className="text-[var(--text-secondary)] text-lg">Your premium note-taking workspace</p>
          </div>
          
          <button
            onClick={handleSignIn}
            disabled={authLoading}
            className={`w-full px-8 py-4 rounded-lg font-semibold transition-all shadow-[var(--shadow-md)] ${
              authLoading 
                ? 'bg-[var(--bg-hover)] text-[var(--text-tertiary)] cursor-not-allowed' 
                : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white hover:shadow-[var(--shadow-lg)] hover:scale-[1.02]'
            }`}
          >
            {authLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </div>
            ) : (
              'Continue with Google'
            )}
          </button>
          
          <div className="text-sm text-[var(--text-tertiary)] space-y-3">
            <p>Secure authentication powered by Google</p>
            <p>Make sure pop-ups are allowed for this site</p>
          </div>
          
          {/* Troubleshooting button */}
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline transition-colors"
          >
            Having trouble? Refresh the page
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
          <div className="text-[var(--text-secondary)] font-medium">Loading your notes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-secondary)] overflow-hidden">
      <EnhancedSidebar 
        onShowSearch={() => setShowSearch(true)}
        userEmail={currentUser?.email || ''}
        onSignOut={handleSignOut}
      />
      <EnhancedNoteList />
      <div className="flex-1 flex flex-col min-h-0">
        {/* Premium Enterprise Top Navigation Bar */}
        <div className="h-[56px] bg-[var(--bg-primary)] border-b border-[var(--border-light)] flex items-center justify-between px-8 shadow-[var(--shadow-xs)] flex-shrink-0">
          <div className="flex items-center gap-8">
            <h1 className="text-apple-title-sm text-gradient-primary">Clarity</h1>
            
            {/* Premium Integrated Search Bar */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="search-apple flex items-center gap-3 hover-lift"
            >
              <Search size={16} className="text-[var(--text-tertiary)]" />
              <span className="flex-1 text-left text-[var(--text-secondary)]">Search notes, projects...</span>
              <span className="text-[13px] text-[var(--text-tertiary)] bg-[var(--bg-hover)] px-2 py-1 rounded font-medium">⌘K</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            
            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(true)}
              className="btn-apple-icon hover-lift"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            
            {/* Premium Create Button */}
            <button
              onClick={handleCreateNote}
              className="btn-apple-primary hover-lift"
            >
              <Plus size={16} className="mr-2" />
              Create Note
            </button>
          </div>
        </div>
        
        {/* Editor content */}
        <div className="flex-1 bg-[var(--bg-primary)] min-h-0 overflow-hidden">
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