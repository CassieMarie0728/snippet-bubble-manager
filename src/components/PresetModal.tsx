import { motion, AnimatePresence } from 'motion/react';
import type { SnippetPreset, Folder } from '../types';

interface PresetModalProps {
  isOpen: boolean;
  editingPreset: SnippetPreset | null;
  folders: Folder[];
  complexityOptions: Array<'S' | 'M' | 'L'>;
  onClose: () => void;
  onSave: (presetData: Partial<SnippetPreset>) => void;
  onDelete: (id: string) => void;
  languageOptions: Array<{ label: string; value: string }>;
}

export function PresetModal({
  isOpen,
  editingPreset,
  folders,
  complexityOptions,
  onClose,
  onSave,
  onDelete,
  languageOptions
}: PresetModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-6">
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
            className="relative w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden p-8"
          >
            <h2 className="text-xl font-bold mb-4">{editingPreset ? 'Edit Preset' : 'Create Preset'}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onSave({
                  name: formData.get('presetName') as string,
                  title: formData.get('presetTitle') as string,
                  language: formData.get('presetLanguage') as string,
                  description: formData.get('presetDescription') as string,
                  tags: (formData.get('presetTags') as string).split(',').map(t => t.trim()).filter(Boolean),
                  labels: (formData.get('presetLabels') as string).split(',').map(t => t.trim()).filter(Boolean),
                  platform: (formData.get('presetPlatform') as string).trim(),
                  framework: (formData.get('presetFramework') as string).trim(),
                  complexity: (formData.get('presetComplexity') as string) as 'S' | 'M' | 'L',
                  folderId: (formData.get('presetFolderId') as string) || null,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preset Name</label>
                <input
                  required
                  name="presetName"
                  defaultValue={editingPreset?.name || ''}
                  placeholder="e.g. API Starter"
                  className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Title</label>
                  <input
                    name="presetTitle"
                    defaultValue={editingPreset?.title || ''}
                    placeholder="Optional"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Language</label>
                  <select
                    name="presetLanguage"
                    defaultValue={editingPreset?.language || 'javascript'}
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors appearance-none cursor-pointer"
                  >
                    {languageOptions.map(lang => (
                      <option key={lang.value} value={lang.value} className="bg-zinc-900">
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Platform</label>
                  <input
                    name="presetPlatform"
                    defaultValue={editingPreset?.platform || ''}
                    placeholder="web"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Framework</label>
                  <input
                    name="presetFramework"
                    defaultValue={editingPreset?.framework || ''}
                    placeholder="react"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Complexity</label>
                  <select
                    name="presetComplexity"
                    defaultValue={editingPreset?.complexity || 'M'}
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors appearance-none cursor-pointer"
                  >
                    {complexityOptions.map(option => (
                      <option key={option} value={option} className="bg-zinc-900">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Folder</label>
                  <select
                    name="presetFolderId"
                    defaultValue={editingPreset?.folderId || ''}
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">No Folder</option>
                    {folders.map(folder => (
                      <option key={folder.id} value={folder.id} className="bg-zinc-900">
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tags</label>
                <input
                  name="presetTags"
                  defaultValue={editingPreset?.tags?.join(', ') || ''}
                  placeholder="api, server"
                  className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Labels</label>
                <input
                  name="presetLabels"
                  defaultValue={editingPreset?.labels?.join(', ') || ''}
                  placeholder="backend"
                  className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                <input
                  name="presetDescription"
                  defaultValue={editingPreset?.description || ''}
                  placeholder="Optional"
                  className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-zinc-800 text-white font-bold rounded-2xl hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-400 transition-all"
                >
                  {editingPreset ? 'Update' : 'Create'}
                </button>
              </div>
              {editingPreset?.id && (
                <button
                  type="button"
                  onClick={() => onDelete(editingPreset.id!)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Delete Preset
                </button>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
