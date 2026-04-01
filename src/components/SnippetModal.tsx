import { AnimatePresence, motion } from 'motion/react';
import Editor from '@monaco-editor/react';
import { Book, FolderPlus, RefreshCw, Settings2, Sparkles, Wand2, X } from 'lucide-react';
import type { Snippet, SnippetPreset } from '../types';
import type { SnippetTemplate } from '../templates';
import { cn } from '../utils/cn';

interface SnippetModalProps {
  isOpen: boolean;
  editingSnippet: Snippet | null;
  formRef: React.RefObject<HTMLFormElement>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  aiPrompt: string;
  setAiPrompt: (value: string) => void;
  isGenerating: boolean;
  onGenerateAI: () => void;
  showTemplates: boolean;
  setShowTemplates: (value: boolean) => void;
  templates: SnippetTemplate[];
  fixedPresets: Array<Omit<SnippetPreset, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>>;
  presets: SnippetPreset[];
  onApplyTemplate: (template: SnippetTemplate) => void;
  onApplyPreset: (preset: SnippetPreset | (Omit<SnippetPreset, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> & { name: string })) => void;
  onOpenPresetModal: (preset?: SnippetPreset | null) => void;
  onOpenFolderModal: () => void;
  indentSize: 2 | 4;
  setIndentSize: (value: 2 | 4) => void;
  formatCode: () => void;
  editorCode: string;
  setEditorCode: (value: string) => void;
  selectedLanguage: string;
  setSelectedLanguage: (value: string) => void;
  languageOptions: Array<{ label: string; value: string }>;
  folders: Array<{ id?: string; name: string }>;
  tagsInputRef: React.RefObject<HTMLInputElement>;
  labelsInputRef: React.RefObject<HTMLInputElement>;
  recentTags: string[];
  recentLabels: string[];
  complexityOptions: Array<'S' | 'M' | 'L'>;
}

export function SnippetModal({
  isOpen,
  editingSnippet,
  formRef,
  onClose,
  onSubmit,
  aiPrompt,
  setAiPrompt,
  isGenerating,
  onGenerateAI,
  showTemplates,
  setShowTemplates,
  templates,
  fixedPresets,
  presets,
  onApplyTemplate,
  onApplyPreset,
  onOpenPresetModal,
  onOpenFolderModal,
  indentSize,
  setIndentSize,
  formatCode,
  editorCode,
  setEditorCode,
  selectedLanguage,
  setSelectedLanguage,
  languageOptions,
  folders,
  tagsInputRef,
  labelsInputRef,
  recentTags,
  recentLabels,
  complexityOptions
}: SnippetModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="p-8 pb-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{editingSnippet ? 'Edit Snippet' : 'New Snippet'}</h2>
                <button 
                  type="button"
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-brand/5 border border-brand/20 rounded-3xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <span className="text-xs font-bold text-brand uppercase tracking-widest">Generate with AI</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 hover:text-brand transition-colors uppercase tracking-widest"
                  >
                    <Book className="w-3 h-3" />
                    {showTemplates ? 'Hide Templates' : 'Use Template'}
                  </button>
                </div>
                
                <AnimatePresence>
                  {showTemplates ? (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-2 pb-2">
                        {templates.map((template) => (
                          <button
                            key={template.name}
                            type="button"
                            onClick={() => onApplyTemplate(template)}
                            className="text-left p-3 bg-black/40 border border-zinc-800 rounded-2xl hover:border-brand/50 hover:bg-brand/5 transition-all group"
                          >
                            <div className="text-xs font-bold text-zinc-300 group-hover:text-brand transition-colors">{template.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">{template.description}</div>
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-2 pb-2">
                        <div className="col-span-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">Presets</div>
                        {fixedPresets.map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => onApplyPreset(preset)}
                            className="text-left p-3 bg-black/40 border border-zinc-800 rounded-2xl hover:border-emerald-400/50 hover:bg-emerald-500/5 transition-all group"
                          >
                            <div className="text-xs font-bold text-zinc-300 group-hover:text-emerald-300 transition-colors">{preset.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">Fixed preset</div>
                          </button>
                        ))}
                        {presets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => onApplyPreset(preset)}
                            className="text-left p-3 bg-black/40 border border-zinc-800 rounded-2xl hover:border-emerald-400/50 hover:bg-emerald-500/5 transition-all group"
                          >
                            <div className="text-xs font-bold text-zinc-300 group-hover:text-emerald-300 transition-colors">{preset.name}</div>
                            <div className="text-[10px] text-zinc-500 mt-1 line-clamp-1">Saved preset</div>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => onOpenPresetModal(null)}
                          className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest hover:text-emerald-200"
                        >
                          + Add Preset
                        </button>
                        <button
                          type="button"
                          onClick={() => presets[0] && onOpenPresetModal(presets[0])}
                          className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-300"
                        >
                          Manage Presets
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. 'React hook for local storage' or 'Python script to scrape a website'"
                        className="flex-1 bg-black/40 border border-brand/10 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-brand/50 transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onGenerateAI())}
                      />
                      <button 
                        type="button"
                        onClick={onGenerateAI}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="px-6 bg-brand text-white font-bold rounded-2xl hover:bg-brand-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isGenerating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Wand2 className="w-4 h-4" />
                        )}
                        Generate
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <form ref={formRef} onSubmit={onSubmit} className="p-8 space-y-6">
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
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors appearance-none cursor-pointer"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.value} value={lang.value} className="bg-zinc-900">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Folder</label>
                <div className="flex gap-2">
                  <select 
                    name="folderId"
                    defaultValue={editingSnippet?.folderId || ''}
                    className="flex-1 bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">No Folder</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id} className="bg-zinc-900">
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={onOpenFolderModal}
                    className="p-3 bg-zinc-800 rounded-2xl hover:bg-zinc-700 transition-colors"
                    title="Create New Folder"
                  >
                    <FolderPlus className="w-6 h-6 text-zinc-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Platform</label>
                  <input
                    name="platform"
                    defaultValue={editingSnippet?.platform || ''}
                    placeholder="web, mobile, cli..."
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Framework</label>
                  <input
                    name="framework"
                    defaultValue={editingSnippet?.framework || ''}
                    placeholder="react, express..."
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Complexity</label>
                  <select
                    name="complexity"
                    defaultValue={editingSnippet?.complexity || 'M'}
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors appearance-none cursor-pointer"
                  >
                    {complexityOptions.map(option => (
                      <option key={option} value={option} className="bg-zinc-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custom Sort Order</label>
                <input
                  name="customOrder"
                  defaultValue={editingSnippet?.customOrder?.toString() || ''}
                  placeholder="e.g. 100"
                  className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                />
                <p className="text-[10px] text-zinc-600">Lower numbers appear first when using Custom sort.</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Code Content</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-zinc-800">
                      <button
                        type="button"
                        onClick={() => setIndentSize(2)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded transition-all",
                          indentSize === 2 ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        2 SPACES
                      </button>
                      <button
                        type="button"
                        onClick={() => setIndentSize(4)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded transition-all",
                          indentSize === 4 ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        4 SPACES
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={formatCode}
                      className="text-[10px] font-bold text-brand hover:text-brand-hover uppercase tracking-tighter border border-brand/20 px-2 py-1 rounded-lg hover:bg-brand/5 transition-all flex items-center gap-1"
                    >
                      <Settings2 className="w-3 h-3" />
                      Format
                    </button>
                  </div>
                </div>
                <div className="w-full bg-black/40 border border-zinc-800 rounded-2xl overflow-hidden min-h-[400px]">
                  <Editor
                    height="400px"
                    language={selectedLanguage}
                    value={editorCode}
                    theme="vs-dark"
                    onChange={(value) => setEditorCode(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', monospace",
                      padding: { top: 16, bottom: 16 },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      folding: true,
                      lineNumbers: 'on',
                      renderLineHighlight: 'all',
                      scrollbar: {
                        vertical: 'hidden',
                        horizontal: 'hidden'
                      },
                      tabSize: indentSize,
                      wordWrap: 'on'
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tags (comma separated)</label>
                <input 
                  ref={tagsInputRef}
                  name="tags"
                  defaultValue={editingSnippet?.tags?.join(', ')}
                  placeholder="e.g. android, api, template"
                  className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                />
                {recentTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recentTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!tagsInputRef.current) return;
                          const existing = tagsInputRef.current.value
                            .split(',')
                            .map(t => t.trim())
                            .filter(Boolean);
                          if (!existing.includes(tag)) {
                            tagsInputRef.current.value = [...existing, tag].join(', ');
                          }
                        }}
                        className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Labels (comma separated)</label>
                <input 
                  ref={labelsInputRef}
                  name="labels"
                  defaultValue={editingSnippet?.labels?.join(', ')}
                  placeholder="e.g. billing, frontend, infra"
                  className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-brand/50 transition-colors"
                />
                {recentLabels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {recentLabels.map(label => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          if (!labelsInputRef.current) return;
                          const existing = labelsInputRef.current.value
                            .split(',')
                            .map(t => t.trim())
                            .filter(Boolean);
                          if (!existing.includes(label)) {
                            labelsInputRef.current.value = [...existing, label].join(', ');
                          }
                        }}
                        className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/20 transition-colors"
                      >
                        @{label}
                      </button>
                    ))}
                  </div>
                )}
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
                  onClick={onClose}
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
  );
}
