/**
 * Structural subsets of the native drag/keyboard events: the component needs only
 * these members, and plain objects can implement them in specs without type
 * assertions (jsdom has no DragEvent/DataTransfer constructors).
 */
export interface PreventableEvent {
  preventDefault(): void;
}

export interface FileTransfer {
  files: ArrayLike<File>;
}

export interface FileDropEvent extends PreventableEvent {
  dataTransfer: FileTransfer | null;
}

export interface ZoneKeyEvent extends PreventableEvent {
  key: string;
}
