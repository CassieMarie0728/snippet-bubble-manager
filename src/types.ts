export interface Snippet {
  id?: string;
  title: string;
  code: string;
  language?: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
  isPinned?: boolean;
  ownerId: string;
  lastCopiedAt?: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
}

export interface Folder {
  id?: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}
