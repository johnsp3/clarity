import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 100;

  logRender(componentName: string, renderTime: number) {
    this.metrics.push({
      componentName,
      renderTime,
      timestamp: Date.now()
    });

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Log slow renders
    if (renderTime > 16) { // More than one frame at 60fps
      console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  getMetrics() {
    return [...this.metrics];
  }

  getAverageRenderTime(componentName: string) {
    const componentMetrics = this.metrics.filter(m => m.componentName === componentName);
    if (componentMetrics.length === 0) return 0;
    
    const total = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return total / componentMetrics.length;
  }

  getSlowestComponents(limit = 5) {
    const componentAverages = new Map<string, number>();
    
    // Calculate averages for each component
    const componentNames = [...new Set(this.metrics.map(m => m.componentName))];
    componentNames.forEach(name => {
      componentAverages.set(name, this.getAverageRenderTime(name));
    });

    // Sort by average render time
    return Array.from(componentAverages.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([name, avgTime]) => ({ name, avgTime }));
  }

  clear() {
    this.metrics = [];
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// Hook for monitoring component render performance
export const usePerformanceMonitor = (componentName: string, enabled = process.env.NODE_ENV === 'development') => {
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    
    startTimeRef.current = performance.now();
  });

  useEffect(() => {
    if (!enabled) return;
    
    const renderTime = performance.now() - startTimeRef.current;
    performanceMonitor.logRender(componentName, renderTime);
  });

  return {
    getMetrics: () => performanceMonitor.getMetrics(),
    getAverageRenderTime: (name?: string) => 
      performanceMonitor.getAverageRenderTime(name || componentName),
    getSlowestComponents: () => performanceMonitor.getSlowestComponents(),
    clearMetrics: () => performanceMonitor.clear()
  };
};

// Hook for measuring specific operations
export const useOperationTimer = () => {
  const measure = (name: string, operation: () => void | Promise<void>) => {
    const start = performance.now();
    
    const result = operation();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const duration = performance.now() - start;
        console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      });
    } else {
      const duration = performance.now() - start;
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
      return result;
    }
  };

  return { measure };
};

// Export the monitor instance for global access
export { performanceMonitor }; 