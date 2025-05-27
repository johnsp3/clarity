import { useState, useEffect, useMemo } from 'react'

interface UseVirtualizationProps {
  items: any[]
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface VirtualItem {
  index: number
  start: number
  end: number
}

export const useVirtualization = ({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: UseVirtualizationProps) => {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    )

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  const virtualItems = useMemo(() => {
    const items: VirtualItem[] = []
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight
      })
    }
    return items
  }, [visibleRange, itemHeight])

  const totalHeight = items.length * itemHeight

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  return {
    virtualItems,
    totalHeight,
    handleScroll,
    visibleRange
  }
}

// Debounced search hook for better performance
export const useDebouncedValue = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
} 