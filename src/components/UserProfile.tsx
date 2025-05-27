import React, { useState } from 'react'
import { User, LogOut, ChevronDown } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { signOutUser, auth } from '../services/firebase'

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
                   hover:bg-[#F5F5F7] active:scale-[0.98]
                   transition-all duration-200 group focus-apple"
          title={userEmail}
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
              <div className="w-full h-full bg-[#007AFF] flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex flex-col items-start min-w-0 flex-1">
            {displayName && (
              <span className="text-[15px] font-medium text-[#1D1D1F] truncate max-w-[140px]">
                {displayName}
              </span>
            )}
            <span className="text-[13px] text-[#86868B] truncate max-w-[140px]">
              {userEmail}
            </span>
          </div>
          
          <ChevronDown 
            size={14} 
            className="transition-colors duration-200 flex-shrink-0 text-[#86868B]"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="dropdown-apple min-w-[240px] z-apple-dropdown animate-apple-scale-in"
          sideOffset={8}
          align="end"
        >
          <div className="px-4 py-4 border-b border-[#D2D2D7]">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                {photoURL && !imageError ? (
                  <img
                    src={photoURL}
                    alt={displayName || userEmail}
                    className="w-full h-full object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-[#007AFF] flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                {displayName && (
                  <p className="text-[15px] font-medium text-[#1D1D1F] truncate">
                    {displayName}
                  </p>
                )}
                <p className="text-[13px] text-[#86868B] truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            </div>
            <p className="text-apple-footnote">
              SIGNED IN WITH GOOGLE
            </p>
          </div>

          <DropdownMenu.Item 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="dropdown-item-apple text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut size={16} />
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
} 