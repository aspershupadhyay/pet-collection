import React, { useState } from 'react';
import { PetAction, PetDefinition } from '../types/pet';
import { PET_ACTIONS } from '../data/pets';
import { PetRenderer } from './PetRenderer';
import { generateToolSnippet } from '../utils/toolExport';
import { soundEngine } from '../utils/audio';
import {
  Heart,
  Copy,
  Check,
  ArrowUpRight,
  Terminal,
  Sparkles,
} from 'lucide-react';

interface ListViewProps {
  pets: PetDefinition[];
  globalAction: PetAction | 'auto';
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onSelectPet: (pet: PetDefinition) => void;
  onQuickCopy: (pet: PetDefinition) => void;
  renderMode?: 'pixel' | 'ascii';
}

export const ListView: React.FC<ListViewProps> = ({
  pets,
  globalAction,
  bookmarks,
  onToggleBookmark,
  onSelectPet,
  onQuickCopy,
  renderMode = 'pixel',
}) => {
  const [activePetId, setActivePetId] = useState<string>(pets[0]?.id || '');
  const [previewAction, setPreviewAction] = useState<PetAction>('idle');
  const [previewVariant, setPreviewVariant] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const selectedPet =
    pets.find((p) => p.id === activePetId) || pets[0] || null;

  const effectiveAction: PetAction =
    globalAction === 'auto' ? previewAction : globalAction;

  const effectiveVariant =
    previewVariant && selectedPet?.availableVariants.includes(previewVariant)
      ? previewVariant
      : selectedPet?.sprites.variant || '';

  const handleCopySnippet = () => {
    if (!selectedPet) return;
    const code = generateToolSnippet(
      selectedPet,
      'claude',
      effectiveAction,
      effectiveVariant
    );
    navigator.clipboard.writeText(code);
    soundEngine.play('celebrate', selectedPet.soundPitch);
    setCopied(true);
    onQuickCopy(selectedPet);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="-mx-(--gutter) flex flex-col border-t border-dashed border-line-strong">
      {/* Exact Designeer Master-Detail Split Layout */}
      <div className="flex items-start">
        {/* Left 17rem Directory List */}
        <div className="h-[calc(100dvh-11rem)] w-full shrink-0 overflow-y-auto scrollbar-none border-dashed border-line-strong p-2.5 lg:w-[19rem] lg:border-r">
          <ul className="flex flex-col gap-0.5">
            {pets.map((pet) => {
              const isSelected = selectedPet?.id === pet.id;
              const isSaved = bookmarks.includes(pet.id);
              return (
                <li key={pet.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPet?.id !== pet.id) {
                        setActivePetId(pet.id);
                        setPreviewVariant(pet.sprites.variant);
                        setPreviewAction('idle');
                      } else if (!window.matchMedia('(min-width: 1024px)').matches) {
                        // On compact screens the preview pane is hidden — open the inspector instead
                        onSelectPet(pet);
                      }
                    }}
                    className={`flex w-full items-center gap-2.5 rounded-[10px] pr-2 pl-2.5 py-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-well text-ink font-medium shadow-[inset_0_0_0_1px_var(--line-strong)]'
                        : 'text-ink-2 hover:bg-well/50 hover:text-ink'
                    }`}
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-page shadow-[inset_0_0_0_1px_var(--line)]">
                      <img
                        src={pet.sprites.idle}
                        alt=""
                        className="size-4 object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </span>

                    <span className="truncate text-body flex-1">{pet.name}</span>

                    <span className="font-mono text-[10px] text-ink-3 truncate max-w-[5.5rem]">
                      {pet.species}
                    </span>

                    {isSaved && (
                      <Heart className="size-3 shrink-0 fill-[#FF6568] text-[#FF6568]" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right Live 3D Companion Stage Preview (Exact Designeer List Preview Pane) */}
        {selectedPet && (
          <div className="grid h-[calc(100dvh-11rem)] min-w-0 flex-1 place-items-center p-6 max-lg:hidden overflow-y-auto">
            <div className="flex w-full max-w-xl flex-col items-center gap-4">
              {/* 3D Voxel Stage Card */}
              <div className="relative h-72 w-full overflow-hidden rounded-tile bg-well shadow-[inset_0_0_0_1px_var(--line-strong),0_20px_50px_-15px_rgba(0,0,0,0.5)]">
                <PetRenderer
                  pet={selectedPet}
                  action={effectiveAction}
                  size={270}
                  interactive={true}
                  tilt={true}
                  variantOverride={effectiveVariant}
                  habitatOverride={selectedPet.habitat}
                  renderMode={renderMode}
                  onActionTrigger={(a) => setPreviewAction(a)}
                />

                <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
                  <span className="rounded-full bg-black/75 px-3 py-1 font-mono text-[11px] text-white backdrop-blur-md">
                    {selectedPet.toolOrigin} · state: {effectiveAction}
                  </span>
                </div>

                {selectedPet.availableVariants.length > 1 && (
                  <div className="absolute top-3 right-3 z-20 flex items-center gap-1">
                    {selectedPet.availableVariants.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setPreviewVariant(v)}
                        className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] cursor-pointer ${
                          effectiveVariant === v
                            ? 'bg-white text-black font-semibold'
                            : 'bg-black/70 text-white/75 hover:text-white'
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title & Tagline */}
              <div className="text-center max-w-md">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-display text-[18px] font-medium text-ink">
                    {selectedPet.name}
                  </h2>
                  <span className="text-ink-3">·</span>
                  <span className="text-body text-ink-2">
                    {selectedPet.species}
                  </span>
                  <span className="rounded-full bg-well px-2 py-0.5 font-mono text-[10px] text-ink-3">
                    by {selectedPet.author}
                  </span>
                </div>
                <p className="mt-1.5 text-small text-ink-3">
                  {selectedPet.description}
                </p>
              </div>

              {/* 10 Motion Switcher Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                {PET_ACTIONS.slice(0, 10).map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      soundEngine.play('ui_click', selectedPet.soundPitch);
                      setPreviewAction(act.id);
                    }}
                    className={`surface h-8 w-fit shrink-0 rounded-full px-3 text-small font-medium cursor-pointer ${
                      effectiveAction === act.id
                        ? 'surface-primary'
                        : 'surface-outline text-ink-2 hover:text-ink'
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              {/* Action CTAs */}
              <div className="mt-1 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="surface surface-outline inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-small font-medium text-ink cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" style={{ color: '#16A34A' }} />
                      <span>Copied CLI Config</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleBookmark(selectedPet.id)}
                  className="surface surface-outline inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-small font-medium text-ink cursor-pointer"
                >
                  <Heart
                    className={`size-3.5 ${
                      bookmarks.includes(selectedPet.id)
                        ? 'fill-[#FF6568] text-[#FF6568]'
                        : ''
                    }`}
                  />
                  <span>
                    {bookmarks.includes(selectedPet.id) ? 'Saved' : 'Save'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectPet(selectedPet)}
                  className="surface surface-primary inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-small font-medium cursor-pointer"
                >
                  <Terminal className="size-3.5" />
                  <span>Full Inspector</span>
                  <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
