import React, { useState } from 'react'
import { User, LogOut, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
// @ts-expect-error - JavaScript module
import { signOutUser, auth } from '../services/firebase.js'

interface UserProfileProps {
  userEmail: string
  onSignOut: () => void
}

export const UserProfile: React.FC<UserProfileProps> = ({ userEmail, onSignOut }) => {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Get current user data from Firebase auth
  const currentUser = auth?.currentUser
  const photoURL = currentUser?.photoURL
  const displayName = currentUser?.displayName

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOutUser()
      onSignOut()
    } catch (error) {
      console.error('Sign out error:', error)
      setIsSigningOut(false)
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-3 px-3 py-2 rounded-lg
                   bg-white border border-[#E5E5E7] hover:border-[#D1D1D3]
                   transition-colors duration-150 group"
          title={userEmail} // Show full email on hover
        >
          {/* Profile Picture */}
          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
            {photoURL && !imageError ? (
              <img
                src={photoURL}
                alt={displayName || userEmail}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 
                            flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex flex-col items-start min-w-0 flex-1">
            {displayName && (
              <span className="text-sm font-medium text-gray-900 truncate max-w-[140px]">
                {displayName}
              </span>
            )}
            <span className="text-xs text-gray-600 truncate max-w-[140px]">
              {userEmail}
            </span>
          </div>
          
          <ChevronDown 
            size={14} 
            className="text-gray-400 group-hover:text-gray-600 transition-colors duration-150 flex-shrink-0" 
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[240px] bg-white rounded-lg shadow-lg border border-[#E5E5E7] p-1 z-50"
          sideOffset={8}
          align="end"
        >
          <div className="px-3 py-3 border-b border-[#E5E5E7]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {photoURL && !imageError ? (
                  <img
                    src={photoURL}
                    alt={displayName || userEmail}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 
                                flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {displayName && (
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {displayName}
                  </p>
                )}
                <p className="text-xs text-gray-600 truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              Signed in with Google
            </p>
          </div>

          <DropdownMenu.Item 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-gray-50 
                     cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                     text-red-600 hover:text-red-700"
          >
            <LogOut size={14} />
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
} 