import React, { useState, useEffect, useRef } from 'react';
import { PetAction, PetCategory, PetDefinition } from '../types/pet';
import { PET_ACTIONS } from '../data/pets';
import { PetRenderer } from './PetRenderer';
import { generateToolSnippet } from '../utils/toolExport';
import { soundEngine } from '../utils/audio';
import {
  Search,
  Copy,
  Check,
  ArrowUpRight,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  pets: PetDefinition[];
  onSelectPet: (pet: PetDefinition) => void;
  onCopySuccess?: (msg: string) => void;
}

const CATEGORIES: PetCategory[] = [
  'All',
  'Mammals',
  'Mythical',
  'Cyber & AI',
  'Aquatic & Nature',
  'Avian',
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  pets,
  onSelectPet,
  onCopySuccess,
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<PetCategory>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewAction, setPreviewAction] = useState<PetAction>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const filteredPets = pets.filter((p) => {
    if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.species.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.toolOrigin.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      p.signatureMove.toLowerCase().includes(q)
    );
  });

  const activePet = filteredPets[selectedIndex] || filteredPets[0] || pets[0];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
        setQuery('');
        setCategoryFilter('All');
        setSelectedIndex(0);
        setPreviewAction('idle');
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, categoryFilter]);

  // Keyboard navigation (Up/Down/Enter) inside search modal
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredPets.length > 0 ? (prev + 1) % filteredPets.length : 0
      );
      soundEngine.play('ui_click');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredPets.length > 0
          ? (prev - 1 + filteredPets.length) % filteredPets.length
          : 0
      );
      soundEngine.play('ui_click');
    } else if (e.key === 'Enter' && activePet) {
      e.preventDefault();
      soundEngine.play('ui_click', activePet.soundPitch);
      onSelectPet(activePet);
      onClose();
    }
  };

  const handleQuickCopy = (e: React.MouseEvent, pet: PetDefinition) => {
    e.stopPropagation();
    const code = generateToolSnippet(pet, 'claude', previewAction);
    navigator.clipboard.writeText(code);
    soundEngine.play('celebrate', pet.soundPitch);
    setCopiedId(pet.id);
    if (onCopySuccess) {
      onCopySuccess(`Copied ${pet.name} CLI config`);
    }
    setTimeout(() => setCopiedId(null), 1600);
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[95vw] max-w-3xl rounded-[24px] bg-page border border-line-strong text-ink shadow-[var(--shadow-stage)] p-0 backdrop:backdrop-blur-xs backdrop:bg-black/65 outline-none overflow-hidden"
    >
      {/* Top Search Input Row */}
      <div className="flex items-center px-5 py-3.5 border-b border-dashed border-line-strong gap-3">
        <Search className="size-4.5 text-ink-3 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Search companions by name, species, artist (Elthen, Marc Duiker), or tool..."
          className="flex-1 bg-transparent text-[14px] text-ink placeholder:text-ink-3 outline-none"
          autoFocus
        />
        <span className="font-mono text-[11px] text-ink-3 max-sm:hidden">
          {filteredPets.length} results
        </span>
        <button type="button" onClick={onClose} className="key">
          <span>ESC</span>
        </button>
      </div>

      {/* Quick Category Filter Strip */}
      <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-dashed border-line bg-well/40 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`surface h-7 shrink-0 rounded-full px-3 text-small font-medium cursor-pointer ${
              categoryFilter === cat
                ? 'surface-primary'
                : 'surface-outline text-ink-2 hover:text-ink'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Split-Pane Body: Results List Left + Live Interactive Preview Right */}
      <div className="grid md:grid-cols-[1fr_18.5rem] divide-y md:divide-y-0 md:divide-x divide-dashed divide-line-strong">
        {/* Left List */}
        <div className="max-h-[24rem] overflow-y-auto p-2.5 scrollbar-none">
          {filteredPets.length === 0 ? (
            <div className="p-10 text-center text-small text-ink-3">
              No companions found matching "{query}"
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filteredPets.map((pet, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <div
                    key={pet.id}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      soundEngine.play('ui_click', pet.soundPitch);
                      onSelectPet(pet);
                      onClose();
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-well text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                        : 'hover:bg-well/50 text-ink-2'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-11 shrink-0 rounded-xl grid place-items-center bg-page shadow-[inset_0_0_0_1px_var(--line)]">
                        <img
                          src={pet.sprites.idle}
                          alt={pet.name}
                          className="size-8 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display font-medium text-[14px] text-ink truncate">
                            {pet.name}
                          </h4>
                          <span className="text-small text-ink-3 truncate">
                            · {pet.species}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-ink-3 truncate">
                          {pet.toolOrigin} · by {pet.author} · {pet.availableVariants.length} coat{pet.availableVariants.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleQuickCopy(e, pet)}
                        className="surface surface-outline inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium text-ink cursor-pointer"
                      >
                        {copiedId === pet.id ? (
                          <>
                            <Check className="size-3 text-[#16A34A]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <ArrowUpRight className="size-4 text-ink-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Live Companion Preview Stage */}
        {activePet && (
          <div className="flex flex-col justify-between p-4 bg-well/30 max-md:hidden">
            <div>
              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-well shadow-[inset_0_0_0_1px_var(--line)]">
                <PetRenderer
                  pet={activePet}
                  action={previewAction}
                  size={170}
                  interactive={true}
                  habitatOverride={activePet.habitat}
                />
                <span className="absolute top-2 left-2 rounded-full bg-black/75 px-2 py-0.5 font-mono text-[10px] text-white">
                  {previewAction}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-[15px] font-medium text-ink">
                    {activePet.name}
                  </h4>
                  <span className="rounded-full bg-well px-2 py-0.5 font-mono text-[10px] text-ink-2">
                    {activePet.rarity}
                  </span>
                </div>
                <p className="mt-1 text-small text-ink-3 line-clamp-2">
                  {activePet.tagline}
                </p>
              </div>

              {/* Quick Motion Preview Pills */}
              <div className="mt-3">
                <span className="mb-1 block text-[10px] font-mono text-ink-3 uppercase">
                  Test Motion
                </span>
                <div className="flex flex-wrap gap-1">
                  {PET_ACTIONS.slice(0, 6).map((act) => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setPreviewAction(act.id)}
                      className={`surface h-6 rounded-full px-2 text-[10.5px] font-medium cursor-pointer ${
                        previewAction === act.id
                          ? 'surface-primary'
                          : 'surface-outline text-ink-2'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectPet(activePet);
                onClose();
              }}
              className="surface surface-primary mt-4 flex h-8.5 w-full items-center justify-center gap-1.5 rounded-full text-small font-medium cursor-pointer"
            >
              <Terminal className="size-3.5" />
              <span>Open Full Inspector &amp; Export</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Keyboard Hints Footer */}
      <div className="flex items-center justify-between border-t border-dashed border-line px-5 py-2.5 text-[11px] font-mono text-ink-3 bg-page">
        <div className="flex items-center gap-3">
          <span>↑↓ Navigate</span>
          <span>↵ Inspect</span>
          <span>ESC Close</span>
        </div>
        <span className="flex items-center gap-1">
          <Sparkles className="size-3" /> 20 Official Companions Ready
        </span>
      </div>
    </dialog>
  );
};
