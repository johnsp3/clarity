import { KeyboardEvent, RefObject } from 'react'

/**
 * Keyboard navigation keys
 */
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const

/**
 * Check if a keyboard event matches a specific key
 */
export function isKey(event: KeyboardEvent, key: keyof typeof KEYS): boolean {
  return event.key === KEYS[key]
}

/**
 * Handle keyboard navigation for list items
 */
export function handleListKeyboardNavigation(
  event: KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onSelect: (index: number) => void,
  options?: {
    wrap?: boolean
    orientation?: 'vertical' | 'horizontal'
    onEscape?: () => void
  }
) {
  const { wrap = true, orientation = 'vertical', onEscape } = options || {}
  
  const nextKey = orientation === 'vertical' ? KEYS.ARROW_DOWN : KEYS.ARROW_RIGHT
  const prevKey = orientation === 'vertical' ? KEYS.ARROW_UP : KEYS.ARROW_LEFT
  
  switch (event.key) {
    case nextKey: {
      event.preventDefault()
      const nextIndex = currentIndex + 1
      if (nextIndex < totalItems) {
        onSelect(nextIndex)
      } else if (wrap) {
        onSelect(0)
      }
      break
    }
      
    case prevKey: {
      event.preventDefault()
      const prevIndex = currentIndex - 1
      if (prevIndex >= 0) {
        onSelect(prevIndex)
      } else if (wrap) {
        onSelect(totalItems - 1)
      }
      break
    }
      
    case KEYS.HOME:
      event.preventDefault()
      onSelect(0)
      break
      
    case KEYS.END:
      event.preventDefault()
      onSelect(totalItems - 1)
      break
      
    case KEYS.ESCAPE:
      if (onEscape) {
        event.preventDefault()
        onEscape()
      }
      break
  }
}

/**
 * Trap focus within a container
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      }
    }
  }
  
  container.addEventListener('keydown', handleKeyDown as any)
  
  return () => {
    container.removeEventListener('keydown', handleKeyDown as any)
  }
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.style.position = 'absolute'
  announcement.style.left = '-10000px'
  announcement.style.width = '1px'
  announcement.style.height = '1px'
  announcement.style.overflow = 'hidden'
  
  announcement.textContent = message
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Generate unique ID for ARIA relationships
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Manage ARIA expanded state
 */
export function useAriaExpanded(isExpanded: boolean) {
  return {
    'aria-expanded': isExpanded,
    'aria-controls': isExpanded ? generateAriaId('panel') : undefined,
  }
}

/**
 * Manage ARIA selected state
 */
export function useAriaSelected(isSelected: boolean) {
  return {
    'aria-selected': isSelected,
    role: 'option',
  }
}

/**
 * Create keyboard shortcut handler
 */
export function createKeyboardShortcut(
  shortcuts: Record<string, () => void>,
  options?: {
    preventDefault?: boolean
    stopPropagation?: boolean
  }
) {
  const { preventDefault = true, stopPropagation = false } = options || {}
  
  return (event: KeyboardEvent) => {
    const key = event.key.toLowerCase()
    const ctrl = event.ctrlKey || event.metaKey
    const shift = event.shiftKey
    const alt = event.altKey
    
    // Build shortcut string
    let shortcut = ''
    if (ctrl) shortcut += 'ctrl+'
    if (shift) shortcut += 'shift+'
    if (alt) shortcut += 'alt+'
    shortcut += key
    
    if (shortcuts[shortcut]) {
      if (preventDefault) event.preventDefault()
      if (stopPropagation) event.stopPropagation()
      shortcuts[shortcut]()
    }
  }
}

/**
 * Skip to main content link handler
 */
export function skipToMain(mainId = 'main-content') {
  const main = document.getElementById(mainId)
  if (main) {
    main.tabIndex = -1
    main.focus()
    main.scrollIntoView()
  }
}

/**
 * Manage focus restoration
 */
export class FocusManager {
  private previousFocus: HTMLElement | null = null
  
  saveFocus() {
    this.previousFocus = document.activeElement as HTMLElement
  }
  
  restoreFocus() {
    if (this.previousFocus && this.previousFocus.focus) {
      this.previousFocus.focus()
    }
  }
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Get appropriate transition duration based on user preference
 */
export function getTransitionDuration(defaultDuration: number): number {
  return prefersReducedMotion() ? 0 : defaultDuration
}

/**
 * Create live region for dynamic content updates
 */
export function createLiveRegion(
  ariaLive: 'polite' | 'assertive' = 'polite',
  ariaRelevant: string = 'additions text'
) {
  return {
    role: 'region',
    'aria-live': ariaLive,
    'aria-relevant': ariaRelevant,
    'aria-atomic': 'false',
  }
}

/**
 * Manage roving tabindex for composite widgets
 */
export function useRovingTabIndex(
  items: RefObject<HTMLElement>[],
  activeIndex: number
) {
  items.forEach((item, index) => {
    if (item.current) {
      item.current.tabIndex = index === activeIndex ? 0 : -1
    }
  })
}

/**
 * Format number for screen readers
 */
export function formatNumberForScreenReader(num: number, singular: string, plural: string): string {
  return `${num} ${num === 1 ? singular : plural}`
}

/**
 * Create descriptive label for interactive elements
 */
export function createAriaLabel(action: string, target: string, context?: string): string {
  let label = `${action} ${target}`
  if (context) {
    label += `, ${context}`
  }
  return label
} 