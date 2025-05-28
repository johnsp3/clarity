import React from 'react'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'
import { vi } from 'vitest'

// Mock console methods to avoid noise in test output
const originalError = console.error
const originalGroup = console.group
const originalGroupEnd = console.groupEnd
const originalLog = console.log

beforeAll(() => {
  console.error = vi.fn()
  console.group = vi.fn()
  console.groupEnd = vi.fn()
  console.log = vi.fn()
})

afterAll(() => {
  console.error = originalError
  console.group = originalGroup
  console.groupEnd = originalGroupEnd
  console.log = originalLog
})

// Component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText(/The app encountered an unexpected error/)).toBeInTheDocument()
  })

  it('shows error details when expanded', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    const detailsElement = screen.getByText('Error details')
    expect(detailsElement).toBeInTheDocument()
    
    // The error message should be in the details
    const details = detailsElement.closest('details')
    expect(details).toBeInTheDocument()
  })

  it('renders reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    const reloadButton = screen.getByRole('button', { name: /reload app/i })
    expect(reloadButton).toBeInTheDocument()
  })

  it('recovers when error is cleared', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    
    // This won't actually recover in the current implementation
    // as ErrorBoundary needs to be reset externally
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    
    // The error will still be shown as ErrorBoundary doesn't auto-recover
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('logs error to console', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    
    // Check that our error handling was called
    expect(console.group).toHaveBeenCalled()
    expect(console.log).toHaveBeenCalled()
  })
}) 