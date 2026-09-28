import { useEffect, useMemo, useState } from 'react';
import { Command, Search, X } from 'lucide-react';

export interface CommandPaletteItem {
  id: string;
  label: string;
  hint: string;
  keywords?: string;
  danger?: boolean;
}

export default function CommandPalette({
  items,
  onSelect,
}: {
  items: CommandPaletteItem[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      [item.label, item.hint, item.keywords || ''].join(' ').toLowerCase().includes(needle)
    );
  }, [items, query]);

  if (!open) {
    return (
      <button
        className="command-palette-trigger pointer-events-auto"
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
      >
        <Command size={14} />
        <span>Command</span>
        <kbd>⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center bg-black/55 px-4 pt-[12vh] backdrop-blur-md" onMouseDown={() => setOpen(false)}>
      <div className="command-palette" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-white/7 px-4">
          <Search size={17} className="text-white/30" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search ECLIPSE commands…"
            className="h-14 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />
          <button className="rounded-full p-2 text-white/30 hover:bg-white/5 hover:text-white/70" onClick={() => setOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2 scrollbar-coquette">
          {filtered.map((item) => (
            <button
              key={item.id}
              className={`command-palette-item ${item.danger ? 'is-danger' : ''}`}
              onClick={() => {
                setOpen(false);
                setQuery('');
                onSelect(item.id);
              }}
            >
              <span>
                <b>{item.label}</b>
                <small>{item.hint}</small>
              </span>
              <span className="text-[9px] uppercase tracking-[.16em] text-white/20">enter</span>
            </button>
          ))}
          {!filtered.length && <div className="px-4 py-8 text-center text-xs text-white/25">No command matches that search.</div>}
        </div>
        <div className="border-t border-white/7 px-4 py-3 text-[9px] uppercase tracking-[.18em] text-white/20">
          ECLIPSE control plane · keyboard ready
        </div>
      </div>
    </div>
  );
}
