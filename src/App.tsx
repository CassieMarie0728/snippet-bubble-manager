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
  Terminal,
  FileCode,
  Check,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Layout
} from 'lucide-react';
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
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { db, auth } from './firebase';
import { Snippet } from './types';

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

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const [bubblePos, setBubblePos] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'pinned' | 'favorites'>('all');

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

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

  // Snippet Handlers
  const saveSnippet = async (snippetData: Partial<Snippet>) => {
    if (!user) return;

    const now = new Date().toISOString();
    try {
      if (editingSnippet?.id) {
        const docRef = doc(db, 'snippets', editingSnippet.id);
        await updateDoc(docRef, {
          ...snippetData,
          updatedAt: now
        });
      } else {
        await addDoc(collection(db, 'snippets'), {
          ...snippetData,
          ownerId: user.uid,
          createdAt: now,
          updatedAt: now,
          isFavorite: snippetData.isFavorite || false,
          isPinned: snippetData.isPinned || false,
          tags: snippetData.tags || []
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

  // Filtering
  const filteredSnippets = useMemo(() => {
    let result = snippets;
    
    if (activeTab === 'pinned') result = result.filter(s => s.isPinned);
    if (activeTab === 'favorites') result = result.filter(s => s.isFavorite);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(query) ||
        s.code.toLowerCase().includes(query) ||
        s.language?.toLowerCase().includes(query) ||
        s.tags?.some(t => t.toLowerCase().includes(query))
      );
    }
    return result;
  }, [snippets, searchQuery, activeTab]);

  // Bubble Drag Logic
  const bubbleRef = useRef<HTMLDivElement>(null);
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Snap to edges logic could go here, but for now simple follow
    setBubblePos({
      x: window.innerWidth - clientX - 30,
      y: window.innerHeight - clientY - 30
    });
  };

  const handleDragEnd = () => {
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
          
          <div className="flex items-center gap-2">
            {(['all', 'pinned', 'favorites'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
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
                className="group bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg truncate">{snippet.title}</h3>
                      {snippet.isPinned && <Pin className="w-3 h-3 text-brand fill-brand" />}
                      {snippet.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                        {snippet.language || 'Plain Text'}
                      </span>
                      {snippet.tags?.map(tag => (
                        <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => togglePin(snippet)}
                      className={cn("p-2 rounded-lg hover:bg-zinc-800 transition-colors", snippet.isPinned && "text-brand")}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => toggleFavorite(snippet)}
                      className={cn("p-2 rounded-lg hover:bg-zinc-800 transition-colors", snippet.isFavorite && "text-amber-500")}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setEditingSnippet(snippet);
                        setIsAddModalOpen(true);
                      }}
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => deleteSnippet(snippet.id!)}
                      className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative flex-1 bg-black/40 rounded-2xl overflow-hidden group/code">
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    <SyntaxHighlighter
                      language={snippet.language?.toLowerCase() || 'text'}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1.5rem',
                        background: 'transparent',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                      }}
                      codeTagProps={{
                        style: {
                          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
                        }
                      }}
                    >
                      {snippet.code}
                    </SyntaxHighlighter>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 to-transparent pointer-events-none" />
                  <button 
                    onClick={() => copyToClipboard(snippet)}
                    className="absolute bottom-3 right-3 p-2 bg-brand text-white rounded-xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 z-10"
                  >
                    {copyFeedback === snippet.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-xs font-bold">{copyFeedback === snippet.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                
                {snippet.description && (
                  <p className="mt-4 text-xs text-zinc-500 line-clamp-2 italic">
                    {snippet.description}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

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
            onClick={() => setIsBubbleExpanded(!isBubbleExpanded)}
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
                      onChange={(e) => setSearchQuery(e.target.value)}
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
                        className="w-full group flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-800/50 transition-all text-left"
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

                <div className="p-3 bg-black/20 border-t border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-600 font-mono tracking-tighter">
                    DRAG BUBBLE TO MOVE
                  </span>
                  <button 
                    onClick={() => setIsBubbleExpanded(false)}
                    className="text-[10px] font-bold text-brand hover:text-brand-hover uppercase"
                  >
                    Close Panel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingSnippet(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  saveSnippet({
                    title: formData.get('title') as string,
                    code: formData.get('code') as string,
                    language: formData.get('language') as string,
                    description: formData.get('description') as string,
                    tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
                    isPinned: editingSnippet?.isPinned || false,
                    isFavorite: editingSnippet?.isFavorite || false,
                  });
                }}
                className="p-8 space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-2xl font-bold">{editingSnippet ? 'Edit Snippet' : 'New Snippet'}</h2>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingSnippet(null);
                    }}
                    className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Title</label>
                    <input 
                      required
                      name="title"
                      defaultValue={editingSnippet?.title}
                      placeholder="e.g. Retrofit GET Template"
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Language</label>
                    <select 
                      name="language"
                      defaultValue={editingSnippet?.language || 'text'}
                      className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors appearance-none cursor-pointer"
                    >
                      {POPULAR_LANGUAGES.map(lang => (
                        <option key={lang.value} value={lang.value} className="bg-zinc-900">
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Code Content</label>
                    <button
                      type="button"
                      onClick={() => {
                        const form = document.querySelector('form') as HTMLFormElement;
                        const codeArea = form.querySelector('textarea[name="code"]') as HTMLTextAreaElement;
                        const langSelect = form.querySelector('select[name="language"]') as HTMLSelectElement;
                        let code = codeArea.value;
                        const lang = langSelect.value;

                        try {
                          if (lang === 'json') {
                            code = JSON.stringify(JSON.parse(code), null, 2);
                          } else {
                            // Basic indentation logic for curly brace languages
                            let indent = 0;
                            code = code.split('\n')
                              .map(line => {
                                line = line.trim();
                                if (line.endsWith('}') || line.startsWith('}')) indent = Math.max(0, indent - 1);
                                const formatted = '  '.repeat(indent) + line;
                                if (line.endsWith('{') || line.startsWith('{')) indent++;
                                return formatted;
                              })
                              .join('\n');
                          }
                          codeArea.value = code;
                        } catch (e) {
                          console.error('Formatting failed', e);
                        }
                      }}
                      className="text-[10px] font-bold text-brand hover:text-brand-hover uppercase tracking-tighter border border-brand/20 px-2 py-1 rounded-lg hover:bg-brand/5 transition-all"
                    >
                      Auto-Format
                    </button>
                  </div>
                  <textarea 
                    required
                    name="code"
                    defaultValue={editingSnippet?.code}
                    rows={8}
                    placeholder="Paste your code here..."
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-4 px-4 font-mono text-sm focus:outline-none focus:border-brand/50 transition-colors resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tags (comma separated)</label>
                  <input 
                    name="tags"
                    defaultValue={editingSnippet?.tags?.join(', ')}
                    placeholder="e.g. android, api, template"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description (optional)</label>
                  <input 
                    name="description"
                    defaultValue={editingSnippet?.description}
                    placeholder="Short explanation of what this does..."
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-brand text-white font-bold rounded-2xl hover:bg-brand-hover transition-all shadow-lg shadow-brand/10"
                  >
                    {editingSnippet ? 'Update Snippet' : 'Save Snippet'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setEditingSnippet(null);
                    }}
                    className="flex-1 py-4 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                  >
                    Cancel
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
