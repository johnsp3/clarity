import React, { memo, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Note } from '../store/useStore';
import { MemoizedNoteCard } from './MemoizedNoteCard';

interface VirtualNoteListProps {
  notes: Note[];
  height: number;
  itemHeight: number;
  activeNoteId: string | null;
  selectedNoteIds: Set<string>;
  favoriteNoteIds: Set<string>;
  onNoteClick: (noteId: string) => void;
  onToggleSelection: (noteId: string) => void;
  onToggleFavorite: (noteId: string) => void;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    notes: Note[];
    activeNoteId: string | null;
    selectedNoteIds: Set<string>;
    favoriteNoteIds: Set<string>;
    onNoteClick: (noteId: string) => void;
    onToggleSelection: (noteId: string) => void;
    onToggleFavorite: (noteId: string) => void;
  };
}

const ListItem = memo<ListItemProps>(({ index, style, data }) => {
  const {
    notes,
    activeNoteId,
    selectedNoteIds,
    favoriteNoteIds,
    onNoteClick,
    onToggleSelection,
    onToggleFavorite
  } = data;

  const note = notes[index];
  if (!note) return null;

  return (
    <div style={style}>
      <MemoizedNoteCard
        note={note}
        isActive={activeNoteId === note.id}
        isSelected={selectedNoteIds.has(note.id)}
        isFavorite={favoriteNoteIds.has(note.id)}
        onClick={() => onNoteClick(note.id)}
        onToggleSelection={() => onToggleSelection(note.id)}
        onToggleFavorite={() => onToggleFavorite(note.id)}
      />
    </div>
  );
});

ListItem.displayName = 'VirtualListItem';

export const VirtualNoteList = memo<VirtualNoteListProps>(({
  notes,
  height,
  itemHeight,
  activeNoteId,
  selectedNoteIds,
  favoriteNoteIds,
  onNoteClick,
  onToggleSelection,
  onToggleFavorite
}) => {
  const itemData = useMemo(() => ({
    notes,
    activeNoteId,
    selectedNoteIds,
    favoriteNoteIds,
    onNoteClick,
    onToggleSelection,
    onToggleFavorite
  }), [
    notes,
    activeNoteId,
    selectedNoteIds,
    favoriteNoteIds,
    onNoteClick,
    onToggleSelection,
    onToggleFavorite
  ]);

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg font-medium mb-2">No notes found</p>
          <p className="text-sm">Create your first note to get started</p>
        </div>
      </div>
    );
  }

  return (
    <List
      height={height}
      width="100%"
      itemCount={notes.length}
      itemSize={itemHeight}
      itemData={itemData}
      overscanCount={5}
      className="scrollbar-hide"
    >
      {ListItem}
    </List>
  );
});

VirtualNoteList.displayName = 'VirtualNoteList'; 