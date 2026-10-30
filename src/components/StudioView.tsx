import React, { useState } from 'react';
import { PetAction, PetDefinition, PetHabitat } from '../types/pet';
import { PETS, PET_ACTIONS } from '../data/pets';
import { PetRenderer } from './PetRenderer';
import { soundEngine } from '../utils/audio';
import { Terminal, Copy, Check, X } from 'lucide-react';
import { generateToolSnippet } from '../utils/toolExport';

interface StudioViewProps {
  onSelectPet?: (pet: PetDefinition) => void;
  onCopySuccess?: (msg: string) => void;
  onCopy?: (msg: string, sub?: string) => void;
  onClose?: () => void;
  muted?: boolean;
}

const HABITATS: { id: PetHabitat; label: string }[] = [
  { id: 'forest', label: 'Forest' },
  { id: 'castle', label: 'Castle' },
  { id: 'beach', label: 'Beach' },
  { id: 'autumn', label: 'Autumn' },
  { id: 'winter', label: 'Winter' },
  { id: 'library', label: 'Library' },
  { id: 'none', label: 'Minimal Well' },
];

export const StudioView: React.FC<StudioViewProps> = ({
  onCopySuccess,
  onCopy,
  onClose,
}) => {
  const [selectedPet, setSelectedPet] = useState<PetDefinition>(PETS[0]);
  const [action, setAction] = useState<PetAction>('idle');
  const [variant, setVariant] = useState<string>(PETS[0].sprites.variant);
  const [habitat, setHabitat] = useState<PetHabitat>('forest');
  const [renderMode, setRenderMode] = useState<'pixel' | 'ascii'>('pixel');
  const [copied, setCopied] = useState(false);

  const handlePetChange = (pet: PetDefinition) => {
    setSelectedPet(pet);
    setVariant(pet.sprites.variant);
    setHabitat(pet.habitat);
    soundEngine.play('ui_click', pet.soundPitch);
  };

  const handleQuickCopy = () => {
    const code = generateToolSnippet(selectedPet, 'claude', action, variant);
    navigator.clipboard.writeText(code);
    setCopied(true);
    if (onCopySuccess) onCopySuccess(`Copied ${selectedPet.name} configuration`);
    if (onCopy) onCopy(`Copied ${selectedPet.name} configuration`, 'Ready to paste into Claude Code / VS Code');
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-page/75 backdrop-blur-sm transition-opacity" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-popup-in relative z-10 w-full max-w-5xl overflow-hidden rounded-sheet layer-float p-6 sm:p-8 my-auto"
      >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[20px] font-medium text-ink">
            Companion Action Sandbox
          </h1>
          <p className="text-small text-ink-3">
            Test all 20 companions across 11 states, pixel habitats, coat colors, and Claude Code `/buddy` ASCII mode.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setRenderMode((m) => (m === 'pixel' ? 'ascii' : 'pixel'))
            }
            className="surface surface-outline inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-small font-medium text-ink cursor-pointer"
          >
            <Terminal className="size-3.5" />
            <span>{renderMode === 'pixel' ? 'Switch to CLI /buddy' : 'Switch to 8fps Pixel'}</span>
          </button>

          <button
            type="button"
            onClick={handleQuickCopy}
            className="surface surface-primary inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-small font-medium text-white cursor-pointer"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Config'}</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sandbox"
              className="surface surface-outline grid size-8 place-items-center rounded-full text-ink-2 hover:text-ink cursor-pointer"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        {/* Interactive Stage */}
        <div className="flex flex-col gap-4">
          <div className="relative flex h-80 flex-col items-center justify-center overflow-hidden rounded-tile bg-well shadow-[inset_0_0_0_1px_var(--line)]">
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
              <span className="rounded-full bg-page/90 px-3 py-1 font-mono text-small font-medium text-ink shadow-[inset_0_0_0_1px_var(--line)]">
                {selectedPet.name} · {selectedPet.species}
              </span>
              <span className="rounded-full bg-page/90 px-2.5 py-1 font-mono text-[11px] text-ink-3 shadow-[inset_0_0_0_1px_var(--line)]">
                state: {action}
              </span>
            </div>

            <PetRenderer
              pet={selectedPet}
              action={action}
              size={250}
              interactive={true}
              variantOverride={variant}
              habitatOverride={habitat}
              renderMode={renderMode}
              onActionTrigger={(a) => setAction(a)}
            />
          </div>

          {/* 11 Action Triggers */}
          <div className="rounded-tile bg-well p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-small font-medium text-ink">11 Companion States</span>
              <span className="font-mono text-[11px] text-ink-3">Click or press shortcut</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {PET_ACTIONS.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    setAction(act.id);
                    soundEngine.play('ui_click', selectedPet.soundPitch);
                  }}
                  className={`surface flex items-center justify-between rounded-xl px-3 py-2 text-small font-medium cursor-pointer ${
                    action === act.id
                      ? 'surface-primary'
                      : 'surface-outline text-ink-2 hover:text-ink'
                  }`}
                >
                  <span>{act.label}</span>
                  <kbd className="font-mono text-[10px] opacity-65">{act.shortcut}</kbd>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Roster & Environment Picker */}
        <div className="flex flex-col gap-4">
          <div className="rounded-tile bg-well p-4">
            <span className="mb-2.5 block text-small font-medium text-ink">
              Select Companion (20)
            </span>
            <div className="grid grid-cols-4 gap-1.5 max-h-56 overflow-y-auto scrollbar-none">
              {PETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePetChange(p)}
                  title={p.name}
                  className={`surface flex flex-col items-center justify-center rounded-xl p-2 cursor-pointer ${
                    selectedPet.id === p.id
                      ? 'surface-primary'
                      : 'surface-outline text-ink-2 hover:text-ink'
                  }`}
                >
                  <img
                    src={p.sprites.idle}
                    alt={p.name}
                    className="size-7 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <span className="mt-1 truncate max-w-full text-[10px]">
                    {p.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedPet.availableVariants.length > 1 && (
            <div className="rounded-tile bg-well p-4">
              <span className="mb-2 block text-small font-medium text-ink">
                Coat Color ({selectedPet.availableVariants.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedPet.availableVariants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant(v)}
                    className={`surface h-7 rounded-full px-3 font-mono text-[11px] cursor-pointer ${
                      variant === v
                        ? 'surface-primary'
                        : 'surface-outline text-ink-2 hover:text-ink'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-tile bg-well p-4">
            <span className="mb-2 block text-small font-medium text-ink">
              Pixel Scene Backdrop
            </span>
            <div className="flex flex-wrap gap-1.5">
              {HABITATS.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHabitat(h.id)}
                  className={`surface h-7 rounded-full px-3 text-[11px] cursor-pointer ${
                    habitat === h.id
                      ? 'surface-primary'
                      : 'surface-outline text-ink-2 hover:text-ink'
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
