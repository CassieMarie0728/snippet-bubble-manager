import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Copy, 
  Edit2, 
  Trash2, 
  Star, 
  Pin, 
  X, 
  Maximize2, 
  Minimize2, 
  LogOut, 
  Settings,
  Code,
  Github,
  Check,
  Layout,
  Download,
  Upload,
  Folder as FolderIcon,
  Sparkles
} from 'lucide-react';
import { SNIPPET_TEMPLATES, SnippetTemplate } from './templates';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup,
  signInWithRedirect, 
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { OnMount } from '@monaco-editor/react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { db, auth } from './firebase';
import { Snippet, Folder, SmartFolder, SmartFolderRuleSet, SnippetPreset } from './types';
import { SnippetCard } from './components/SnippetCard';
import { SmartFolderModal } from './components/SmartFolderModal';
import { PresetModal } from './components/PresetModal';
import { SnippetModal } from './components/SnippetModal';
import { cn } from './utils/cn';

// Popular languages for the dropdown
const POPULAR_LANGUAGES = [
  { label: 'Plain Text', value: 'text' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'C#', value: 'csharp' },
  { label: 'PHP', value: 'php' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'Swift', value: 'swift' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'SQL', value: 'sql' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Bash', value: 'bash' },
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'XML', value: 'xml' },
  { label: 'C', value: 'c' },
  { label: 'R', value: 'r' },
  { label: 'Dart', value: 'dart' },
  { label: 'Scala', value: 'scala' },
  { label: 'Perl', value: 'perl' },
  { label: 'Lua', value: 'lua' },
];

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:10000';

type SortOption = 'added' | 'updated' | 'name' | 'favorites' | 'custom';

const FIXED_PRESETS: Omit<SnippetPreset, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Frontend Starter',
    title: 'New UI Component',
    language: 'typescript',
    tags: ['ui', 'component'],
    labels: ['frontend'],
    platform: 'web',
    framework: 'react',
    complexity: 'M',
  },
  {
    name: 'Backend Handler',
    title: 'New API Handler',
    language: 'typescript',
    tags: ['api', 'server'],
    labels: ['backend'],
    platform: 'server',
    framework: 'express',
    complexity: 'M',
  },
  {
    name: 'SQL Quick',
    title: 'Query Template',
    language: 'sql',
    tags: ['sql'],
    labels: ['data'],
    platform: 'database',
    framework: 'postgres',
    complexity: 'S',
  },
];

const AVAILABLE_FOLDER_COLORS = [
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#f43f5e',
  '#a3a3a3',
];

const AVAILABLE_FOLDER_ICONS = [
  'folder',
  'spark',
  'rocket',
  'shield',
  'bolt',
  'book',
  'terminal',
  'code',
  'cube',
  'tag',
];

const COMPLEXITY_OPTIONS: Array<'S' | 'M' | 'L'> = ['S', 'M', 'L'];

async function fetchAICompletion(context: string, language: string) {
  const response = await fetch(`${API_BASE_URL}/api/gemini/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context,
      language,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI completion request failed: ${response.status}`);
  }

  const data = await response.json();
  return (data.text || '').trim();
}

async function generateSnippetFromPrompt(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/api/gemini/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: `Generate a code snippet for: ${prompt}. Return ONLY a JSON object with "code", "language", and "title" fields. The "language" should be a lowercase string (e.g., "javascript", "python"). The "title" should be a short, descriptive title for the snippet.`,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI generation request failed: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.text);
}

// Error Handler for Firestore
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSnippet, setEditingSnippet] = useState<Snippet | null>(null);
  const [isBubbleExpanded, setIsBubbleExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [bubblePos, setBubblePos] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'favorites' | 'folder'>('all');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [smartFolders, setSmartFolders] = useState<SmartFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedSmartFolderId, setSelectedSmartFolderId] = useState<string | null>(null);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isSmartFolderModalOpen, setIsSmartFolderModalOpen] = useState(false);
  const [editingSmartFolder, setEditingSmartFolder] = useState<SmartFolder | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [indentSize, setIndentSize] = useState<2 | 4>(2);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editorCode, setEditorCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isInternalChange = useRef(false);
  const monacoRef = useRef<any>(null);
  const completionProviderRef = useRef<any>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const tagsInputRef = useRef<HTMLInputElement>(null);
  const labelsInputRef = useRef<HTMLInputElement>(null);
  const [recentTags, setRecentTags] = useState<string[]>([]);
  const [recentLabels, setRecentLabels] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('updated');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [presets, setPresets] = useState<SnippetPreset[]>([]);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SnippetPreset | null>(null);

  // Auth Listener + Redirect Result Handling
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('Google redirect sign-in successful:', result.user.email);
        }
      })
      .catch((error) => {
        console.error('Redirect result failed:', error);
        alert(`Redirect sign-in failed: ${error instanceof Error ? error.message : String(error)}`);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  // History Management
  useEffect(() => {
    if (isAddModalOpen) {
      const initialCode = editingSnippet?.code || '';
      const initialLang = editingSnippet?.language || 'javascript';
      setEditorCode(initialCode);
      setSelectedLanguage(initialLang);
      setHistory([initialCode]);
      setHistoryIndex(0);
    }
  }, [isAddModalOpen, editingSnippet]);

  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (editorCode !== history[historyIndex]) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(editorCode);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [editorCode]);

  const undo = () => {
    if (historyIndex > 0) {
      isInternalChange.current = true;
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setEditorCode(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isInternalChange.current = true;
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setEditorCode(history[newIndex]);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    monacoRef.current = monaco;
  };

  useEffect(() => {
    if (!monacoRef.current) return;

    // Dispose previous provider if exists
    if (completionProviderRef.current) {
      completionProviderRef.current.dispose();
    }

    // Register AI Completion Provider for the currently selected language
    completionProviderRef.current = monacoRef.current.languages.registerCompletionItemProvider(selectedLanguage, {
      triggerCharacters: ['.', ' ', '(', '{'],
      provideCompletionItems: async (model: any, position: any) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        });

        // Only suggest if there's enough context
        if (textUntilPosition.length < 10) return { suggestions: [] };

        try {
          const completion = await fetchAICompletion(textUntilPosition, selectedLanguage);
          if (!completion) return { suggestions: [] };

          return {
            suggestions: [
              {
                label: 'AI Suggestion',
                kind: monacoRef.current.languages.CompletionItemKind.Snippet,
                insertText: completion,
                detail: 'Generated by Gemini',
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              },
            ],
          };
        } catch (error) {
          console.error('AI Completion failed:', error);
          return { suggestions: [] };
        }
      },
    });

    return () => {
      if (completionProviderRef.current) {
        completionProviderRef.current.dispose();
      }
    };
  }, [selectedLanguage, monacoRef.current]);

  // Firestore Connection Test
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Fetch Snippets
  useEffect(() => {
    if (!user) {
      setSnippets([]);
      return;
    }

    const q = query(
      collection(db, 'snippets'),
      where('ownerId', '==', user.uid),
      orderBy('isPinned', 'desc'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Snippet[];
      setSnippets(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'snippets');
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch Folders
  useEffect(() => {
    if (!user) {
      setFolders([]);
      return;
    }

    const q = query(
      collection(db, 'folders'),
      where('ownerId', '==', user.uid),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Folder[];
      setFolders(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'folders');
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch Smart Folders
  useEffect(() => {
    if (!user) {
      setSmartFolders([]);
      return;
    }

    const q = query(
      collection(db, 'smartFolders'),
      where('ownerId', '==', user.uid),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SmartFolder[];
      setSmartFolders(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'smartFolders');
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch Presets
  useEffect(() => {
    if (!user) {
      setPresets([]);
      return;
    }

    const q = query(
      collection(db, 'presets'),
      where('ownerId', '==', user.uid),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SnippetPreset[];
      setPresets(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'presets');
    });

    return () => unsubscribe();
  }, [user]);

  // Auth Handlers
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const saveFolder = async (name: string, color?: string, icon?: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'folders'), {
        name,
        color: color || '#3b82f6',
        icon: icon || 'folder',
        ownerId: user.uid,
        createdAt: now,
        updatedAt: now
      });
      setIsFolderModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'folders');
    }
  };

  const saveSmartFolder = async (name: string, rules: SmartFolderRuleSet, color?: string, icon?: string) => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      if (editingSmartFolder?.id) {
        await updateDoc(doc(db, 'smartFolders', editingSmartFolder.id), {
          name,
          rules,
          color: color || editingSmartFolder.color || '#22c55e',
          icon: icon || editingSmartFolder.icon || 'spark',
          updatedAt: now
        });
      } else {
        await addDoc(collection(db, 'smartFolders'), {
          name,
          rules,
          color: color || '#22c55e',
          icon: icon || 'spark',
          ownerId: user.uid,
          createdAt: now,
          updatedAt: now
        });
      }
      setIsSmartFolderModalOpen(false);
      setEditingSmartFolder(null);
    } catch (error) {
      handleFirestoreError(error, editingSmartFolder ? OperationType.UPDATE : OperationType.CREATE, 'smartFolders');
    }
  };

  const deleteSmartFolder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'smartFolders', id));
      if (selectedSmartFolderId === id) {
        setSelectedSmartFolderId(null);
        setActiveTab('all');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `smartFolders/${id}`);
    }
  };

  const savePreset = async (presetData: Partial<SnippetPreset>) => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      if (editingPreset?.id) {
        await updateDoc(doc(db, 'presets', editingPreset.id), {
          ...presetData,
          updatedAt: now
        });
      } else {
        await addDoc(collection(db, 'presets'), {
          ...presetData,
          ownerId: user.uid,
          createdAt: now,
          updatedAt: now
        });
      }
      setIsPresetModalOpen(false);
      setEditingPreset(null);
    } catch (error) {
      handleFirestoreError(error, editingPreset ? OperationType.UPDATE : OperationType.CREATE, 'presets');
    }
  };

  const deletePreset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'presets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `presets/${id}`);
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      // First, unassign snippets from this folder
      const snippetsInFolder = snippets.filter(s => s.folderId === id);
      for (const s of snippetsInFolder) {
        await updateDoc(doc(db, 'snippets', s.id!), {
          folderId: null,
          updatedAt: new Date().toISOString()
        });
      }
      await deleteDoc(doc(db, 'folders', id));
      if (selectedFolderId === id) {
        setSelectedFolderId(null);
        setActiveTab('all');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `folders/${id}`);
    }
  };

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateSnippetFromPrompt(aiPrompt);
      
      if (formRef.current) {
        const titleInput = formRef.current.querySelector('input[name="title"]') as HTMLInputElement;
        
        if (titleInput) titleInput.value = result.title;
        setEditorCode(result.code);
        const langExists = POPULAR_LANGUAGES.some(l => l.value === result.language);
        setSelectedLanguage(langExists ? result.language : 'text');
      }
      setAiPrompt('');
    } catch (error) {
      console.error('AI Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCode = () => {
    if (!formRef.current) return;
    let code = editorCode;
    const lang = selectedLanguage;

    try {
      if (lang === 'json') {
        code = JSON.stringify(JSON.parse(code), null, indentSize);
      } else {
        // Advanced indentation logic
        let indent = 0;
        const lines = code.split('\n');
        const formattedLines: string[] = [];

        for (let i = 0; i < lines.length; i++) {
          let line = lines[i].trim();
          if (!line) {
            formattedLines.push('');
            continue;
          }

          // Handle closing braces
          if (line.startsWith('}') || line.endsWith('}')) {
            indent = Math.max(0, indent - 1);
          }

          // Apply indentation
          let formattedLine = ' '.repeat(indent * indentSize) + line;
          formattedLines.push(formattedLine);

          // Handle opening braces
          if (line.endsWith('{') || line.startsWith('{')) {
            indent++;
          }
        }
        code = formattedLines.join('\n');
      }
      setEditorCode(code);
    } catch (e) {
      console.error('Formatting failed', e);
    }
  };

  const applyTemplate = (template: SnippetTemplate) => {
    if (formRef.current) {
      const titleInput = formRef.current.querySelector('input[name="title"]') as HTMLInputElement;
      const descInput = formRef.current.querySelector('input[name="description"]') as HTMLInputElement;
      const tagsInput = formRef.current.querySelector('input[name="tags"]') as HTMLInputElement;

      if (titleInput && template.title) titleInput.value = template.title;
      if (template.code) setEditorCode(template.code);
      if (template.language) {
        const langExists = POPULAR_LANGUAGES.some(l => l.value === template.language);
        setSelectedLanguage(langExists ? template.language : 'text');
      }
      if (descInput && template.description) descInput.value = template.description;
      if (tagsInput && template.tags) tagsInput.value = template.tags.join(', ');
      
      setShowTemplates(false);
    }
  };

  const applyPreset = (preset: SnippetPreset | (Omit<SnippetPreset, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> & { name: string })) => {
    if (formRef.current) {
      const titleInput = formRef.current.querySelector('input[name="title"]') as HTMLInputElement;
      const descInput = formRef.current.querySelector('input[name="description"]') as HTMLInputElement;
      const tagsInput = formRef.current.querySelector('input[name="tags"]') as HTMLInputElement;
      const labelsInput = formRef.current.querySelector('input[name="labels"]') as HTMLInputElement;
      const platformInput = formRef.current.querySelector('input[name="platform"]') as HTMLInputElement;
      const frameworkInput = formRef.current.querySelector('input[name="framework"]') as HTMLInputElement;
      const complexitySelect = formRef.current.querySelector('select[name="complexity"]') as HTMLSelectElement;
      const folderSelect = formRef.current.querySelector('select[name="folderId"]') as HTMLSelectElement;

      if (titleInput && preset.title) titleInput.value = preset.title;
      if (preset.code) setEditorCode(preset.code);
      if (preset.language) {
        const langExists = POPULAR_LANGUAGES.some(l => l.value === preset.language);
        setSelectedLanguage(langExists ? preset.language : 'text');
      }
      if (descInput && preset.description) descInput.value = preset.description;
      if (tagsInput && preset.tags) tagsInput.value = preset.tags.join(', ');
      if (labelsInput && preset.labels) labelsInput.value = preset.labels.join(', ');
      if (platformInput && preset.platform) platformInput.value = preset.platform;
      if (frameworkInput && preset.framework) frameworkInput.value = preset.framework;
      if (complexitySelect && preset.complexity) complexitySelect.value = preset.complexity;
      if (folderSelect && preset.folderId !== undefined) folderSelect.value = preset.folderId || '';
    }
  };

  // Snippet Handlers
  const saveSnippet = async (snippetData: Partial<Snippet>) => {
    if (!user) return;

    // Clean undefined values for Firestore
    const cleanData = Object.fromEntries(
      Object.entries(snippetData).filter(([_, v]) => v !== undefined)
    );

    const now = new Date().toISOString();
    try {
      if (editingSnippet?.id) {
        const docRef = doc(db, 'snippets', editingSnippet.id);
        await updateDoc(docRef, {
          ...cleanData,
          updatedAt: now
        });
      } else {
        await addDoc(collection(db, 'snippets'), {
          ...cleanData,
          ownerId: user.uid,
          createdAt: now,
          updatedAt: now,
          isFavorite: snippetData.isFavorite || false,
          isPinned: snippetData.isPinned || false,
          tags: snippetData.tags || [],
          labels: snippetData.labels || [],
          platform: snippetData.platform || '',
          framework: snippetData.framework || '',
          complexity: snippetData.complexity || 'M',
          customOrder: snippetData.customOrder || Date.now()
        });
      }
      setIsAddModalOpen(false);
      setEditingSnippet(null);
    } catch (error) {
      handleFirestoreError(error, editingSnippet ? OperationType.UPDATE : OperationType.CREATE, 'snippets');
    }
  };

  const deleteSnippet = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'snippets', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `snippets/${id}`);
    }
  };

  const togglePin = async (snippet: Snippet) => {
    try {
      await updateDoc(doc(db, 'snippets', snippet.id!), {
        isPinned: !snippet.isPinned,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `snippets/${snippet.id}`);
    }
  };

  const toggleFavorite = async (snippet: Snippet) => {
    try {
      await updateDoc(doc(db, 'snippets', snippet.id!), {
        isFavorite: !snippet.isFavorite,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `snippets/${snippet.id}`);
    }
  };

  const duplicateSnippet = async (snippet: Snippet) => {
    if (!user) return;
    const now = new Date().toISOString();
    try {
      await addDoc(collection(db, 'snippets'), {
        title: `${snippet.title} (Copy)`,
        code: snippet.code,
        language: snippet.language || 'text',
        description: snippet.description || '',
        tags: snippet.tags || [],
        labels: snippet.labels || [],
        platform: snippet.platform || '',
        framework: snippet.framework || '',
        complexity: snippet.complexity || 'M',
        folderId: snippet.folderId || null,
        ownerId: user.uid,
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
        isPinned: false,
        customOrder: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'snippets');
    }
  };

  const copyToClipboard = (snippet: Snippet) => {
    navigator.clipboard.writeText(snippet.code);
    setCopyFeedback(snippet.id!);
    setTimeout(() => setCopyFeedback(null), 2000);
    
    // Update last copied timestamp
    if (snippet.id) {
      updateDoc(doc(db, 'snippets', snippet.id), {
        lastCopiedAt: new Date().toISOString()
      }).catch(e => console.error('Failed to update lastCopiedAt', e));
    }
  };

  const computeSmartMatch = (snippet: Snippet, rules: SmartFolderRuleSet) => {
    if (rules.favoritesOnly && !snippet.isFavorite) return false;
    if (rules.pinnedOnly && !snippet.isPinned) return false;

    const hasAll = (source: string[] | undefined, required: string[] | undefined) => {
      if (!required || required.length === 0) return true;
      if (!source || source.length === 0) return false;
      const src = source.map(s => s.toLowerCase());
      return required.every(r => src.includes(r.toLowerCase()));
    };

    const hasAny = (source: string[] | undefined, required: string[] | undefined) => {
      if (!required || required.length === 0) return true;
      if (!source || source.length === 0) return false;
      const src = source.map(s => s.toLowerCase());
      return required.some(r => src.includes(r.toLowerCase()));
    };

    if (!hasAll(snippet.tags, rules.tagsAll)) return false;
    if (!hasAny(snippet.tags, rules.tagsAny)) return false;
    if (!hasAll(snippet.labels, rules.labelsAll)) return false;
    if (!hasAny(snippet.labels, rules.labelsAny)) return false;
    if (rules.languages && rules.languages.length > 0) {
      if (!snippet.language || !rules.languages.map(r => r.toLowerCase()).includes(snippet.language.toLowerCase())) return false;
    }
    if (rules.frameworks && rules.frameworks.length > 0) {
      if (!snippet.framework || !rules.frameworks.map(r => r.toLowerCase()).includes(snippet.framework.toLowerCase())) return false;
    }
    if (rules.platforms && rules.platforms.length > 0) {
      if (!snippet.platform || !rules.platforms.map(r => r.toLowerCase()).includes(snippet.platform.toLowerCase())) return false;
    }
    if (rules.complexities && rules.complexities.length > 0) {
      if (!snippet.complexity || !rules.complexities.includes(snippet.complexity)) return false;
    }
    return true;
  };

  // Filtering
  const filteredSnippets = useMemo(() => {
    let result = snippets;
    
    if (activeTab === 'pinned') result = result.filter(s => s.isPinned);
    if (activeTab === 'favorites') result = result.filter(s => s.isFavorite);
    if (activeTab === 'folder' && selectedFolderId) result = result.filter(s => s.folderId === selectedFolderId);
    if (activeTab === 'folder' && selectedSmartFolderId) {
      const smartFolder = smartFolders.find(sf => sf.id === selectedSmartFolderId);
      if (smartFolder) {
        result = result.filter(s => computeSmartMatch(s, smartFolder.rules));
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        s.language?.toLowerCase().includes(query) ||
        s.tags?.some(t => t.toLowerCase().includes(query)) ||
        s.labels?.some(l => l.toLowerCase().includes(query)) ||
        s.platform?.toLowerCase().includes(query) ||
        s.framework?.toLowerCase().includes(query) ||
        s.complexity?.toLowerCase().includes(query)
      );
    }
    if (sortOption === 'added') {
      result = [...result].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } else if (sortOption === 'updated') {
      result = [...result].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    } else if (sortOption === 'name') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOption === 'favorites') {
      result = [...result].sort((a, b) => {
        const favDiff = Number(b.isFavorite) - Number(a.isFavorite);
        if (favDiff !== 0) return favDiff;
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });
    } else if (sortOption === 'custom') {
      result = [...result].sort((a, b) => (a.customOrder || 0) - (b.customOrder || 0));
    }
    return result;
  }, [snippets, searchQuery, activeTab, selectedFolderId, selectedSmartFolderId, smartFolders, sortOption]);

  useEffect(() => {
    const uniqueTags = new Set<string>();
    const uniqueLabels = new Set<string>();
    snippets.forEach(s => {
      (s.tags || []).forEach(t => uniqueTags.add(t));
      (s.labels || []).forEach(l => uniqueLabels.add(l));
    });
    setRecentTags(Array.from(uniqueTags).slice(0, 12));
    setRecentLabels(Array.from(uniqueLabels).slice(0, 12));
  }, [snippets]);

  // Bubble Drag Logic
  const bubbleRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hoveredSnippet, setHoveredSnippet] = useState<Snippet | null>(null);

  useEffect(() => {
    if (!isBubbleExpanded) {
      setHoveredSnippet(null);
    }
  }, [isBubbleExpanded]);

  const exportSnippets = () => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      snippets,
      folders,
      smartFolders,
      presets
    };
    const dataStr = JSON.stringify(payload, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `snippets-export-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importSnippets = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content);
        
        const isLegacy = Array.isArray(importedData);
        const data = isLegacy ? { snippets: importedData } : importedData;

        if (!data || !Array.isArray(data.snippets)) {
          throw new Error('Invalid format: Expected exported snippets');
        }

        let snippetCount = 0;
        let folderCount = 0;
        let smartFolderCount = 0;
        let presetCount = 0;

        // Import folders first
        if (Array.isArray(data.folders)) {
          for (const item of data.folders) {
            const { id, createdAt, updatedAt, ...folderData } = item;
            if (folderData.name) {
              const now = new Date().toISOString();
              await addDoc(collection(db, 'folders'), {
                ...folderData,
                ownerId: user.uid,
                createdAt: now,
                updatedAt: now
              });
              folderCount++;
            }
          }
        }

        // Import smart folders
        if (Array.isArray(data.smartFolders)) {
          for (const item of data.smartFolders) {
            const { id, createdAt, updatedAt, ...smartFolderData } = item;
            if (smartFolderData.name && smartFolderData.rules) {
              const now = new Date().toISOString();
              await addDoc(collection(db, 'smartFolders'), {
                ...smartFolderData,
                ownerId: user.uid,
                createdAt: now,
                updatedAt: now
              });
              smartFolderCount++;
            }
          }
        }

        // Import presets
        if (Array.isArray(data.presets)) {
          for (const item of data.presets) {
            const { id, createdAt, updatedAt, ...presetData } = item;
            if (presetData.name) {
              const now = new Date().toISOString();
              await addDoc(collection(db, 'presets'), {
                ...presetData,
                ownerId: user.uid,
                createdAt: now,
                updatedAt: now
              });
              presetCount++;
            }
          }
        }

        // Import snippets
        for (const item of data.snippets) {
          const { id, createdAt, updatedAt, ...snippetData } = item;
          
          if (snippetData.title && snippetData.code) {
            const now = new Date().toISOString();
            await addDoc(collection(db, 'snippets'), {
              ...snippetData,
              ownerId: user.uid,
              createdAt: now,
              updatedAt: now,
              isPinned: snippetData.isPinned || false,
              isFavorite: snippetData.isFavorite || false,
              tags: Array.isArray(snippetData.tags) ? snippetData.tags : [],
              labels: Array.isArray(snippetData.labels) ? snippetData.labels : [],
              platform: typeof snippetData.platform === 'string' ? snippetData.platform : '',
              framework: typeof snippetData.framework === 'string' ? snippetData.framework : '',
              complexity: typeof snippetData.complexity === 'string' ? snippetData.complexity : 'M',
              customOrder: typeof snippetData.customOrder === 'number' ? snippetData.customOrder : Date.now()
            });
            snippetCount++;
          }
        }
        alert(`Imported ${snippetCount} snippets, ${folderCount} folders, ${smartFolderCount} smart folders, ${presetCount} presets.`);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'snippets');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const bubbleSize = 56;
    const padding = 16;
    const maxRight = window.innerWidth - bubbleSize - padding;
    const maxBottom = window.innerHeight - bubbleSize - padding;

    // Snap to edges logic could go here, but for now simple follow
    setBubblePos({
      x: Math.min(Math.max(window.innerWidth - clientX - bubbleSize / 2, padding), maxRight),
      y: Math.min(Math.max(window.innerHeight - clientY - bubbleSize / 2, padding), maxBottom)
    });
  };

  const handleDragEnd = () => {
    const bubbleSize = 56;
    const padding = 16;
    const rightDistance = bubblePos.x;
    const leftDistance = window.innerWidth - bubbleSize - bubblePos.x;
    const snapToRight = rightDistance <= leftDistance;
    const snappedX = snapToRight ? padding : window.innerWidth - bubbleSize - padding;

    setBubblePos((prev) => ({
      x: snappedX,
      y: Math.min(Math.max(prev.y, padding), window.innerHeight - bubbleSize - padding)
    }));
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDrag);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center border border-brand/20">
              <Code className="w-10 h-10 text-brand" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Snippet Bubble</h1>
            <p className="text-zinc-400 text-lg">Your code snippets, floating wherever you need them.</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full py-4 bg-white text-black font-semibold rounded-2xl hover:bg-zinc-200 transition-colors flex items-center justify-center gap-3"
          >
            <Github className="w-5 h-5" />
            Sign in with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-brand/30">
      {/* Main App Layout */}
      {!isMinimized && (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand/10 rounded-2xl flex items-center justify-center border border-brand/20">
              <Code className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manager</h1>
              <p className="text-zinc-500 text-sm">{snippets.length} snippets saved</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                setIsMinimized(true);
                setIsBubbleExpanded(false);
              }}
              className="p-2 text-zinc-500 hover:text-brand transition-colors flex items-center gap-2"
              title="Minimize to Bubble"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={importSnippets} 
              accept=".json" 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-500 hover:text-brand transition-colors flex items-center gap-2"
              title="Import Snippets"
            >
              <Upload className="w-5 h-5" />
            </button>
            <button 
              onClick={exportSnippets}
              className="p-2 text-zinc-500 hover:text-brand transition-colors flex items-center gap-2"
              title="Export Snippets"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-brand text-white font-semibold rounded-xl hover:bg-brand-hover transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Snippet
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Search & Filters */}
        <div className="space-y-6 mb-12">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-brand transition-colors" />
            <input 
              type="text"
              placeholder="Search snippets by title, code, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand/50 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {(['all', 'pinned', 'favorites'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setSelectedFolderId(null);
                  setSelectedSmartFolderId(null);
                }}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  activeTab === tab 
                    ? "bg-zinc-800 text-white shadow-lg" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}

            <div className="w-px h-4 bg-zinc-800 mx-2" />

            {folders.map((folder) => (
              <div key={folder.id} className="flex items-center group">
                <button
                  onClick={() => {
                    setActiveTab('folder');
                    setSelectedFolderId(folder.id!);
                    setSelectedSmartFolderId(null);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                    activeTab === 'folder' && selectedFolderId === folder.id
                      ? "bg-brand/10 text-brand border border-brand/20 shadow-lg" 
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: folder.color || '#3b82f6' }}
                  />
                  <FolderIcon className="w-3.5 h-3.5" />
                  {folder.name}
                </button>
                <button 
                  onClick={() => deleteFolder(folder.id!)}
                  className="w-0 overflow-hidden group-hover:w-6 group-hover:ml-1 text-zinc-600 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {smartFolders.map((folder) => (
              <div key={folder.id} className="flex items-center group">
                <button
                  onClick={() => {
                    setActiveTab('folder');
                    setSelectedSmartFolderId(folder.id!);
                    setSelectedFolderId(null);
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2",
                    activeTab === 'folder' && selectedSmartFolderId === folder.id
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20 shadow-lg"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  )}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: folder.color || '#22c55e' }}
                  />
                  <Sparkles className="w-3.5 h-3.5" />
                  {folder.name}
                </button>
                <button
                  onClick={() => {
                    setEditingSmartFolder(folder);
                    setIsSmartFolderModalOpen(true);
                  }}
                  className="w-0 overflow-hidden group-hover:w-6 group-hover:ml-1 text-zinc-600 hover:text-brand transition-all"
                  title="Edit Smart Folder"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteSmartFolder(folder.id!)}
                  className="w-0 overflow-hidden group-hover:w-6 group-hover:ml-1 text-zinc-600 hover:text-red-500 transition-all"
                  title="Delete Smart Folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            <button
              onClick={() => setIsFolderModalOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-500 hover:text-brand hover:bg-brand/5 transition-all flex items-center gap-2 border border-dashed border-zinc-800"
            >
              <Plus className="w-3.5 h-3.5" />
              New Folder
            </button>
            <button
              onClick={() => {
                setEditingSmartFolder(null);
                setIsSmartFolderModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-sm font-medium text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/5 transition-all flex items-center gap-2 border border-dashed border-emerald-500/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Smart Folder
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="text-sm text-zinc-500">
            {activeTab === 'folder' && selectedSmartFolderId && (
              <span>Smart folder view</span>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-brand hover:bg-zinc-900 transition-all flex items-center gap-2"
            >
              <Layout className="w-3.5 h-3.5" />
              Sort: {sortOption}
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="absolute right-0 mt-2 w-44 bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-2xl z-10"
                >
                  {(['added', 'updated', 'name', 'favorites', 'custom'] as SortOption[]).map(opt => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortOption(opt);
                        setShowSortMenu(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest transition-colors",
                        sortOption === opt ? "bg-brand/10 text-brand" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Snippet Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSnippets.map((snippet) => (
              <motion.div
                key={snippet.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <SnippetCard
                  snippet={snippet}
                  folders={folders}
                  copyFeedback={copyFeedback}
                  onTogglePin={togglePin}
                  onToggleFavorite={toggleFavorite}
                  onEdit={(s) => {
                    setEditingSnippet(s);
                    setIsAddModalOpen(true);
                  }}
                  onDelete={deleteSnippet}
                  onCopy={copyToClipboard}
                  onDuplicate={duplicateSnippet}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* Floating Bubble UI */}
      <div 
        className="fixed z-50 pointer-events-none"
        style={{ 
          bottom: bubblePos.y, 
          right: bubblePos.x 
        }}
      >
        <div className="relative pointer-events-auto">
          {/* Bubble */}
          <motion.button
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onClick={() => {
              if (isDragging) return;
              if (isMinimized) {
                setIsAddModalOpen(true);
                setEditingSnippet(null);
                setIsBubbleExpanded(false);
                return;
              }
              setIsBubbleExpanded(!isBubbleExpanded);
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border-2 transition-all duration-300",
              isBubbleExpanded 
                ? "bg-zinc-900 border-brand rotate-90" 
                : "bg-brand border-white/20"
            )}
          >
            {isBubbleExpanded ? (
              <X className="w-6 h-6 text-brand" />
            ) : (
              <Code className="w-6 h-6 text-white" />
            )}
          </motion.button>

          {/* Expanded Panel */}
          <AnimatePresence>
            {isBubbleExpanded && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20, x: 20 }}
                className="absolute bottom-20 right-0 w-80 max-h-[500px] bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-4 border-bottom border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-widest">Quick Snippets</h3>
                    <button onClick={() => setIsBubbleExpanded(false)} className="text-zinc-500 hover:text-white">
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setHoveredSnippet(null);
                      }}
                      className="w-full bg-black/40 border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {filteredSnippets.length === 0 ? (
                    <div className="p-8 text-center text-zinc-600 text-sm italic">
                      No snippets found
                    </div>
                  ) : (
                    filteredSnippets.map(snippet => (
                      <button
                        key={snippet.id}
                        onClick={() => copyToClipboard(snippet)}
                        onMouseEnter={() => setHoveredSnippet(snippet)}
                        onMouseLeave={() => setHoveredSnippet(null)}
                        className="w-full group relative flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-800/50 transition-all text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{snippet.title}</span>
                            {snippet.isPinned && <Pin className="w-2 h-2 text-brand fill-brand" />}
                          </div>
                          <span className="text-[10px] text-zinc-500 uppercase font-mono">{snippet.language || 'Text'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {copyFeedback === snippet.id ? (
                            <Check className="w-4 h-4 text-brand" />
                          ) : (
                            <Copy className="w-4 h-4 text-zinc-600 group-hover:text-brand transition-colors" />
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <AnimatePresence>
                  {hoveredSnippet && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="bg-black/40 border-t border-zinc-800 overflow-hidden"
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Preview: {hoveredSnippet.title}</span>
                          <span className="text-[10px] text-zinc-600 font-mono">{hoveredSnippet.language}</span>
                        </div>
                        <div className="max-h-24 overflow-hidden">
                          <SyntaxHighlighter
                            language={hoveredSnippet.language?.toLowerCase() || 'text'}
                            style={vscDarkPlus}
                            customStyle={{
                              margin: 0,
                              padding: '0.5rem',
                              background: 'transparent',
                              fontSize: '9px',
                              lineHeight: '1.2',
                            }}
                            codeTagProps={{
                              style: {
                                fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                              }
                            }}
                          >
                            {hoveredSnippet.code.split('\n').slice(0, 5).join('\n') + (hoveredSnippet.code.split('\n').length > 5 ? '\n...' : '')}
                          </SyntaxHighlighter>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-3 bg-black/20 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600 font-mono tracking-tighter">
                    DRAG BUBBLE TO MOVE
                  </span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => {
                        setIsMinimized(false);
                        setIsBubbleExpanded(false);
                      }}
                      className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 uppercase"
                    >
                      Open Full App
                    </button>
                    <button 
                      onClick={() => setIsBubbleExpanded(false)}
                      className="text-[10px] font-bold text-brand hover:text-brand-hover uppercase"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SnippetModal
        isOpen={isAddModalOpen}
        editingSnippet={editingSnippet}
        formRef={formRef}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingSnippet(null);
        }}
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const customOrderRaw = (formData.get('customOrder') as string).trim();
          const customOrder = customOrderRaw ? Number(customOrderRaw) : undefined;
          saveSnippet({
            title: formData.get('title') as string,
            code: editorCode,
            language: selectedLanguage,
            description: formData.get('description') as string,
            tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
            labels: (formData.get('labels') as string).split(',').map(t => t.trim()).filter(Boolean),
            platform: (formData.get('platform') as string).trim(),
            framework: (formData.get('framework') as string).trim(),
            complexity: (formData.get('complexity') as string) as 'S' | 'M' | 'L',
            customOrder,
            isPinned: editingSnippet?.isPinned || false,
            isFavorite: editingSnippet?.isFavorite || false,
            folderId: formData.get('folderId') as string || null,
          });
        }}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        isGenerating={isGenerating}
        onGenerateAI={generateWithAI}
        showTemplates={showTemplates}
        setShowTemplates={setShowTemplates}
        templates={SNIPPET_TEMPLATES}
        fixedPresets={FIXED_PRESETS}
        presets={presets}
        onApplyTemplate={applyTemplate}
        onApplyPreset={applyPreset}
        onOpenPresetModal={(preset) => {
          setEditingPreset(preset || null);
          setIsPresetModalOpen(true);
        }}
        onOpenFolderModal={() => setIsFolderModalOpen(true)}
        indentSize={indentSize}
        setIndentSize={setIndentSize}
        formatCode={formatCode}
        editorCode={editorCode}
        setEditorCode={setEditorCode}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        languageOptions={POPULAR_LANGUAGES}
        folders={folders}
        tagsInputRef={tagsInputRef}
        labelsInputRef={labelsInputRef}
        recentTags={recentTags}
        recentLabels={recentLabels}
        complexityOptions={COMPLEXITY_OPTIONS}
      />

      <SmartFolderModal
        isOpen={isSmartFolderModalOpen}
        editingSmartFolder={editingSmartFolder}
        availableColors={AVAILABLE_FOLDER_COLORS}
        availableIcons={AVAILABLE_FOLDER_ICONS}
        onClose={() => {
          setIsSmartFolderModalOpen(false);
          setEditingSmartFolder(null);
        }}
        onSave={saveSmartFolder}
      />

      <PresetModal
        isOpen={isPresetModalOpen}
        editingPreset={editingPreset}
        folders={folders}
        complexityOptions={COMPLEXITY_OPTIONS}
        onClose={() => {
          setIsPresetModalOpen(false);
          setEditingPreset(null);
        }}
        onSave={savePreset}
        onDelete={deletePreset}
        languageOptions={POPULAR_LANGUAGES}
      />

      {/* Folder Creation Modal */}
      <AnimatePresence>
        {isFolderModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFolderModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden p-8"
            >
              <h2 className="text-xl font-bold mb-6">Create New Folder</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                saveFolder(
                  formData.get('folderName') as string,
                  formData.get('folderColor') as string,
                  formData.get('folderIcon') as string
                );
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Folder Name</label>
                  <input 
                    required
                    autoFocus
                    name="folderName"
                    placeholder="e.g. Work Projects"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_FOLDER_COLORS.map(color => (
                      <label key={color} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="folderColor" value={color} className="hidden" defaultChecked={color === '#3b82f6'} />
                        <span className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVAILABLE_FOLDER_ICONS.map(icon => (
                      <label key={icon} className="flex items-center justify-center p-2 bg-black/40 border border-zinc-800 rounded-xl cursor-pointer">
                        <input type="radio" name="folderIcon" value={icon} className="hidden" defaultChecked={icon === 'folder'} />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{icon}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsFolderModalOpen(false)}
                    className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-brand text-white font-bold rounded-2xl hover:bg-brand-hover transition-all"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
      `}</style>
    </div>
  );
}
