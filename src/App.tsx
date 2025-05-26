import { useState, useEffect } from 'react';
import SetupWizard from './components/SetupWizard';
// @ts-expect-error - JavaScript module
import { isFirebaseConfigured, reinitializeFirebase, signInWithGoogle, auth } from './services/firebase.js';
import { EnhancedSidebar } from './components/EnhancedSidebar'
import { EnhancedNoteList } from './components/EnhancedNoteList'
import { Editor } from './components/Editor'
import { CommandPalette } from './components/CommandPalette'
import { UserProfile } from './components/UserProfile'
import { SearchPanel } from './components/SearchPanel'
import { useStore } from './store/useStore'
import { onAuthStateChanged } from 'firebase/auth'


function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showSearch, setShowSearch] = useState(false);
  const loadDataFromFirebase = useStore(state => state.loadDataFromFirebase);
  const isLoadingData = useStore(state => state.isLoading);
  const updateNote = useStore(state => state.updateNote);
  const activeNote = useStore(state => state.activeNote);

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
      alert(`Sign in failed: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSignOut = () => {
    // The auth state listener will handle the state updates
    // Just reload to ensure clean state
    window.location.reload();
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
    <div className="flex h-screen bg-gray-50">
      <EnhancedSidebar />
      <EnhancedNoteList />
      <div className="flex-1 flex flex-col">
        {/* Top bar with user profile */}
        <div className="h-16 bg-white border-b border-[#E5E5E7] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900">Clarity</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>AI Search</span>
            </button>
            <UserProfile 
              userEmail={currentUser?.email || ''} 
              onSignOut={handleSignOut}
            />
          </div>
        </div>
        {/* Editor content */}
        <div className="flex-1">
          <Editor />
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
    </div>
  );
}

export default App; 