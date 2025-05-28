# ADR-001: State Management with Zustand

## Status
Accepted

## Context
We needed a state management solution for our React application that would:
- Be simple to use and understand
- Have minimal boilerplate
- Support TypeScript well
- Handle async operations gracefully
- Work well with React DevTools
- Be performant for our use case

## Decision
We chose Zustand over other state management solutions like Redux, MobX, or Context API.

## Consequences

### Positive
- **Minimal boilerplate**: Zustand requires very little setup code
- **TypeScript support**: Excellent TypeScript inference out of the box
- **Performance**: Built-in shallow equality checks and selective subscriptions
- **DevTools**: Works with Redux DevTools for debugging
- **Size**: Very small bundle size (~8KB)
- **Learning curve**: Easy to learn and use
- **Async handling**: Simple async/await support without middleware

### Negative
- **Less ecosystem**: Smaller ecosystem compared to Redux
- **Less structure**: More freedom can lead to inconsistent patterns
- **Testing**: Requires some setup for testing (mocking stores)

## Implementation Details

### Store Structure
```typescript
interface StoreState {
  // State
  notes: Note[]
  activeNoteId: string | null
  
  // Actions
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  
  // Computed values
  filteredNotes: () => Note[]
}
```

### Best Practices
1. Keep actions close to their related state
2. Use computed values for derived state
3. Handle async operations within actions
4. Use TypeScript for type safety
5. Split large stores into slices if needed

## Alternatives Considered

### Redux Toolkit
- Pros: Large ecosystem, time-travel debugging, predictable updates
- Cons: More boilerplate, steeper learning curve, requires middleware for async

### MobX
- Pros: True reactivity, less boilerplate than Redux
- Cons: Magic can be hard to debug, larger bundle size

### React Context + useReducer
- Pros: Built into React, no dependencies
- Cons: Performance issues with frequent updates, verbose for complex state

## References
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [State Management Comparison](https://blog.logrocket.com/zustand-vs-redux/) 