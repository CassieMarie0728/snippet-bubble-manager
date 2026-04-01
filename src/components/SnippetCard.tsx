import { Copy, Edit2, Trash2, Star, Pin, Folder as FolderIcon, Check } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Snippet, Folder } from '../types';
import { cn } from '../utils/cn';

interface SnippetCardProps {
  snippet: Snippet;
  folders: Folder[];
  copyFeedback: string | null;
  onTogglePin: (snippet: Snippet) => void;
  onToggleFavorite: (snippet: Snippet) => void;
  onEdit: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onCopy: (snippet: Snippet) => void;
  onDuplicate: (snippet: Snippet) => void;
}

export function SnippetCard({
  snippet,
  folders,
  copyFeedback,
  onTogglePin,
  onToggleFavorite,
  onEdit,
  onDelete,
  onCopy,
  onDuplicate
}: SnippetCardProps) {
  return (
    <div className="group bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 hover:border-zinc-700 transition-all flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{snippet.title}</h3>
            {snippet.isPinned && <Pin className="w-3 h-3 text-brand fill-brand" />}
            {snippet.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
            {snippet.folderId && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800 rounded-md text-[10px] text-zinc-400 font-medium">
                <FolderIcon className="w-2.5 h-2.5" />
                {folders.find(f => f.id === snippet.folderId)?.name || 'Unknown'}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              {snippet.language || 'Plain Text'}
            </span>
            {snippet.tags?.map(tag => (
              <span key={tag} className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                #{tag}
              </span>
            ))}
            {snippet.labels?.map(label => (
              <span key={label} className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full">
                @{label}
              </span>
            ))}
            {snippet.platform && (
              <span className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full">
                {snippet.platform}
              </span>
            )}
            {snippet.framework && (
              <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">
                {snippet.framework}
              </span>
            )}
            {snippet.complexity && (
              <span className="text-[10px] bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded-full">
                {snippet.complexity}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDuplicate(snippet)}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTogglePin(snippet)}
            className={cn("p-2 rounded-lg hover:bg-zinc-800 transition-colors", snippet.isPinned && "text-brand")}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleFavorite(snippet)}
            className={cn("p-2 rounded-lg hover:bg-zinc-800 transition-colors", snippet.isFavorite && "text-amber-500")}
          >
            <Star className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(snippet)}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(snippet.id!)}
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
          onClick={() => onCopy(snippet)}
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
    </div>
  );
}
