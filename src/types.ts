export interface Snippet {
  id?: string;
  title: string;
  code: string;
  language?: string;
  description?: string;
  tags?: string[];
  labels?: string[];
  platform?: string;
  framework?: string;
  complexity?: 'S' | 'M' | 'L';
  isFavorite?: boolean;
  isPinned?: boolean;
  ownerId: string;
  lastCopiedAt?: string;
  createdAt: string;
  updatedAt: string;
  folderId?: string;
  customOrder?: number;
}

export interface Folder {
  id?: string;
  name: string;
  color?: string;
  icon?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SmartFolderRuleSet {
  tagsAll?: string[];
  tagsAny?: string[];
  labelsAll?: string[];
  labelsAny?: string[];
  languages?: string[];
  frameworks?: string[];
  platforms?: string[];
  complexities?: Array<'S' | 'M' | 'L'>;
  favoritesOnly?: boolean;
  pinnedOnly?: boolean;
}

export interface SmartFolder {
  id?: string;
  name: string;
  rules: SmartFolderRuleSet;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  color?: string;
  icon?: string;
}

export interface SnippetPreset {
  id?: string;
  name: string;
  title?: string;
  language?: string;
  description?: string;
  tags?: string[];
  labels?: string[];
  platform?: string;
  framework?: string;
  complexity?: 'S' | 'M' | 'L';
  folderId?: string | null;
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
