import type { Note, Project } from '../store/useStore'
import type { Folder, Tag } from '../types'

interface BatchOperation {
  type: 'save' | 'delete';
  collection: string;
  id: string;
  data?: Note | Project | Folder | Tag;
  timestamp: number;
}

class FirebaseBatchManager {
  private operations: Map<string, BatchOperation> = new Map();
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 500; // 500ms delay before executing batch
  private readonly MAX_BATCH_SIZE = 500; // Firestore limit

  // Add operation to batch
  addOperation(operation: BatchOperation) {
    const key = `${operation.collection}-${operation.id}`;
    
    // If we already have an operation for this item, update it
    this.operations.set(key, operation);
    
    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    // Set new timeout or execute immediately if batch is full
    if (this.operations.size >= this.MAX_BATCH_SIZE) {
      this.executeBatch();
    } else {
      this.batchTimeout = setTimeout(() => {
        this.executeBatch();
      }, this.BATCH_DELAY);
    }
  }

  // Execute all pending operations
  private async executeBatch() {
    if (this.operations.size === 0) return;
    
    const operations = Array.from(this.operations.values());
    this.operations.clear();
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    try {
      // Group operations by type
      const saveOps = operations.filter(op => op.type === 'save');
      const deleteOps = operations.filter(op => op.type === 'delete');
      
      // Execute saves and deletes in parallel
      await Promise.all([
        this.executeSaveOperations(saveOps),
        this.executeDeleteOperations(deleteOps)
      ]);
      
      console.log(`✅ Executed batch: ${saveOps.length} saves, ${deleteOps.length} deletes`);
    } catch (error) {
      console.error('❌ Batch execution failed:', error);
      
      // Re-queue failed operations with exponential backoff
      operations.forEach(op => {
        setTimeout(() => {
          this.addOperation(op);
        }, Math.min(1000 * Math.pow(2, (op.timestamp % 5)), 10000));
      });
    }
  }

  private async executeSaveOperations(operations: BatchOperation[]) {
    if (operations.length === 0) return;
    
    // Import Firebase functions dynamically to avoid circular dependencies
    const { saveNote, saveProject, saveFolder, saveTag } = await import('./firebaseNotes');
    
    const promises = operations.map(async (op) => {
      try {
        if (!op.data) {
          console.warn(`No data provided for ${op.collection}/${op.id}`);
          return;
        }
        
        switch (op.collection) {
          case 'notes':
            return await saveNote(op.data as Note);
          case 'projects':
            return await saveProject(op.data as Project);
          case 'folders':
            return await saveFolder(op.data as Folder);
          case 'tags':
            return await saveTag(op.data as Tag);
          default:
            console.warn(`Unknown collection: ${op.collection}`);
        }
      } catch (error) {
        console.error(`Failed to save ${op.collection}/${op.id}:`, error);
        throw error;
      }
    });
    
    await Promise.allSettled(promises);
  }

  private async executeDeleteOperations(operations: BatchOperation[]) {
    if (operations.length === 0) return;
    
    // Import Firebase functions dynamically
    const { 
      deleteNoteFromFirebase, 
      deleteProjectFromFirebase, 
      deleteFolderFromFirebase, 
      deleteTagFromFirebase 
    } = await import('./firebaseNotes');
    
    const promises = operations.map(async (op) => {
      try {
        switch (op.collection) {
          case 'notes':
            return await deleteNoteFromFirebase(op.id);
          case 'projects':
            return await deleteProjectFromFirebase(op.id);
          case 'folders':
            return await deleteFolderFromFirebase(op.id);
          case 'tags':
            return await deleteTagFromFirebase(op.id);
          default:
            console.warn(`Unknown collection: ${op.collection}`);
        }
      } catch (error) {
        console.error(`Failed to delete ${op.collection}/${op.id}:`, error);
        throw error;
      }
    });
    
    await Promise.allSettled(promises);
  }

  // Force immediate execution (useful for app shutdown)
  async flush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    await this.executeBatch();
  }
}

// Singleton instance
export const firebaseBatch = new FirebaseBatchManager();

// Convenience functions
export const batchSave = (collection: string, id: string, data: Note | Project | Folder | Tag) => {
  firebaseBatch.addOperation({
    type: 'save',
    collection,
    id,
    data,
    timestamp: Date.now()
  });
};

export const batchDelete = (collection: string, id: string) => {
  firebaseBatch.addOperation({
    type: 'delete',
    collection,
    id,
    timestamp: Date.now()
  });
};

// Flush all pending operations (call on app shutdown)
export const flushBatch = () => firebaseBatch.flush(); 