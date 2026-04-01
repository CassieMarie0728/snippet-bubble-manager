import { motion, AnimatePresence } from 'motion/react';
import type { SmartFolder, SmartFolderRuleSet } from '../types';

interface SmartFolderModalProps {
  isOpen: boolean;
  editingSmartFolder: SmartFolder | null;
  availableColors: string[];
  availableIcons: string[];
  onClose: () => void;
  onSave: (name: string, rules: SmartFolderRuleSet, color?: string, icon?: string) => void;
}

export function SmartFolderModal({
  isOpen,
  editingSmartFolder,
  availableColors,
  availableIcons,
  onClose,
  onSave
}: SmartFolderModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
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
            className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden p-8"
          >
            <h2 className="text-xl font-bold mb-4">{editingSmartFolder ? 'Edit Smart Folder' : 'Create Smart Folder'}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const rules: SmartFolderRuleSet = {
                  tagsAll: (formData.get('tagsAll') as string).split(',').map(t => t.trim()).filter(Boolean),
                  tagsAny: (formData.get('tagsAny') as string).split(',').map(t => t.trim()).filter(Boolean),
                  labelsAll: (formData.get('labelsAll') as string).split(',').map(t => t.trim()).filter(Boolean),
                  labelsAny: (formData.get('labelsAny') as string).split(',').map(t => t.trim()).filter(Boolean),
                  languages: (formData.get('languages') as string).split(',').map(t => t.trim()).filter(Boolean),
                  frameworks: (formData.get('frameworks') as string).split(',').map(t => t.trim()).filter(Boolean),
                  platforms: (formData.get('platforms') as string).split(',').map(t => t.trim()).filter(Boolean),
                  complexities: (formData.get('complexities') as string).split(',').map(t => t.trim()).filter(Boolean) as Array<'S' | 'M' | 'L'>,
                  favoritesOnly: Boolean(formData.get('favoritesOnly')),
                  pinnedOnly: Boolean(formData.get('pinnedOnly')),
                };
                onSave(
                  formData.get('smartFolderName') as string,
                  rules,
                  formData.get('smartFolderColor') as string,
                  formData.get('smartFolderIcon') as string
                );
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Name</label>
                <input
                  required
                  name="smartFolderName"
                  defaultValue={editingSmartFolder?.name || ''}
                  placeholder="e.g. Pinned API Snippets"
                  className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tags (all)</label>
                  <input
                    name="tagsAll"
                    defaultValue={editingSmartFolder?.rules.tagsAll?.join(', ') || ''}
                    placeholder="api, billing"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tags (any)</label>
                  <input
                    name="tagsAny"
                    defaultValue={editingSmartFolder?.rules.tagsAny?.join(', ') || ''}
                    placeholder="react, flutter"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Labels (all)</label>
                  <input
                    name="labelsAll"
                    defaultValue={editingSmartFolder?.rules.labelsAll?.join(', ') || ''}
                    placeholder="frontend"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Labels (any)</label>
                  <input
                    name="labelsAny"
                    defaultValue={editingSmartFolder?.rules.labelsAny?.join(', ') || ''}
                    placeholder="backend, infra"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Languages</label>
                  <input
                    name="languages"
                    defaultValue={editingSmartFolder?.rules.languages?.join(', ') || ''}
                    placeholder="typescript, python"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Frameworks</label>
                  <input
                    name="frameworks"
                    defaultValue={editingSmartFolder?.rules.frameworks?.join(', ') || ''}
                    placeholder="react, express"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Platforms</label>
                  <input
                    name="platforms"
                    defaultValue={editingSmartFolder?.rules.platforms?.join(', ') || ''}
                    placeholder="web, mobile"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Complexities</label>
                  <input
                    name="complexities"
                    defaultValue={editingSmartFolder?.rules.complexities?.join(', ') || ''}
                    placeholder="S, M"
                    className="w-full bg-black/40 border border-zinc-800 rounded-2xl py-3 px-4 focus:outline-none focus:border-emerald-400/50 transition-colors"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input type="checkbox" name="favoritesOnly" defaultChecked={editingSmartFolder?.rules.favoritesOnly || false} />
                  Favorites only
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-400">
                  <input type="checkbox" name="pinnedOnly" defaultChecked={editingSmartFolder?.rules.pinnedOnly || false} />
                  Pinned only
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(color => (
                      <label key={color} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="smartFolderColor" value={color} className="hidden" defaultChecked={color === (editingSmartFolder?.color || '#22c55e')} />
                        <span className="w-6 h-6 rounded-full border border-white/10" style={{ backgroundColor: color }} />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Icon</label>
                  <div className="grid grid-cols-5 gap-2">
                    {availableIcons.map(icon => (
                      <label key={icon} className="flex items-center justify-center p-2 bg-black/40 border border-zinc-800 rounded-xl cursor-pointer">
                        <input type="radio" name="smartFolderIcon" value={icon} className="hidden" defaultChecked={icon === (editingSmartFolder?.icon || 'spark')} />
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest">{icon}</span>
                      </label>
                    ))}
                  </div>
                </div>
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
                  {editingSmartFolder ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
