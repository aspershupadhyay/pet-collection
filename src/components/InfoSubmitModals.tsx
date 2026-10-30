import React, { useEffect, useState } from 'react';
import { X, Check, Sparkles, Terminal, Code2, Layers, Cpu } from 'lucide-react';
import { PetcraftMark } from './PetcraftMark';
import { PetDefinition } from '../types/pet';
import { PETS } from '../data/pets';

interface InfoModalProps {
  onClose: () => void;
  onOpenStudio: () => void;
}

const INFO_STATS: { value: string; label: string }[] = [
  { value: '20', label: 'companions' },
  { value: '11', label: 'live states' },
  { value: '7', label: 'habitats' },
  { value: '5', label: 'export targets' },
];

const INFO_FEATURES: { icon: React.ReactNode; title: string; body: string; tag: string }[] = [
  {
    icon: <Code2 className="size-4" />,
    title: '8fps pixel companions',
    body: 'Hand-drawn sprites with coat variants, idle loops and pixel habitats.',
    tag: 'gif',
  },
  {
    icon: <Terminal className="size-4" />,
    title: 'Claude Code /buddy mode',
    body: 'Five-line ASCII buddies with hats and rarity tiers, measured with Pretext.',
    tag: 'ascii',
  },
  {
    icon: <Cpu className="size-4" />,
    title: 'One-click export',
    body: 'CLI, IDE, shell, TSX or JSON snippets ready to paste into your tool.',
    tag: 'copy',
  },
  {
    icon: <Layers className="size-4" />,
    title: 'Tile, list & canvas views',
    body: 'Browse your way and save favourites into colour-coded folders.',
    tag: 'views',
  },
];

export const InfoModal: React.FC<InfoModalProps> = ({ onClose, onOpenStudio }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="presentation"
    >
      <div className="sheet-scrim fixed inset-0 bg-black/55" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="info-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-popup-in relative z-10 w-full max-w-[30rem] overflow-hidden rounded-sheet bg-page shadow-[var(--shadow-stage)] ring-1 ring-line-strong"
      >
        {/* Close — pinned top-right */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="tap absolute top-3 right-3 z-10 grid size-8 place-items-center rounded-full text-ink-3 transition-colors hover:bg-wash hover:text-ink"
        >
          <X className="size-4" />
        </button>

        {/* Hero band */}
        <div className="relative border-b border-dashed border-line-strong px-6 pt-7 pb-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage: 'radial-gradient(var(--line-strong) 1px, transparent 1px)',
              backgroundSize: '12px 12px',
              maskImage: 'linear-gradient(180deg, black, transparent 85%)',
              WebkitMaskImage: 'linear-gradient(180deg, black, transparent 85%)',
            }}
          />
          <div className="group/brand relative flex items-center gap-3.5">
            <span className="grid size-14 place-items-center rounded-2xl bg-well ring-1 ring-line">
              <PetcraftMark size={36} />
            </span>
            <div className="min-w-0">
              <h2 id="info-title" className="font-pixel text-[19px] leading-none text-ink">
                petcraft<span className="pc-mark-blink text-[#5b7cff]">_</span>
              </h2>
              <p className="mt-2 text-body text-ink-2">
                Tiny pixel companions that live next to your prompt.
              </p>
            </div>
          </div>

          <dl className="relative mt-6 grid grid-cols-4 divide-x divide-dashed divide-line-strong rounded-xl bg-well ring-1 ring-line">
            {INFO_STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-0.5 px-2 py-2.5">
                <dt className="sr-only">{stat.label}</dt>
                <dd className="font-display text-[20px] font-semibold leading-none tabular-nums text-ink">
                  {stat.value}
                </dd>
                <span className="text-[10px] text-ink-3">{stat.label}</span>
              </div>
            ))}
          </dl>
        </div>

        {/* Feature list */}
        <ul className="px-3 py-2">
          {INFO_FEATURES.map((f) => (
            <li
              key={f.title}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-wash"
            >
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-well text-ink-2 ring-1 ring-line">
                {f.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lead font-medium text-ink">{f.title}</span>
                  <span className="font-mono text-[10px] text-ink-3">{f.tag}</span>
                </div>
                <p className="mt-0.5 text-small text-ink-3">{f.body}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-line-strong px-6 py-4">
          <span className="text-small text-ink-3">
            <kbd className="mr-1 rounded-md bg-well px-1.5 py-0.5 font-mono text-[11px] text-ink ring-1 ring-line">⌘K</kbd>
            to search
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenStudio();
              }}
              className="surface surface-outline tap h-8 rounded-full px-3.5 text-body font-medium text-ink"
            >
              Open sandbox
            </button>
            <button
              type="button"
              onClick={onClose}
              className="surface surface-primary tap h-8 rounded-full px-4 text-body font-medium text-white"
            >
              Start exploring
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SubmitModalProps {
  onClose: () => void;
  onAddPet: (pet: PetDefinition) => void;
}

export const SubmitModal: React.FC<SubmitModalProps> = ({ onClose, onAddPet }) => {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Cyber Cat');
  const [tagline, setTagline] = useState('');
  const [toolOrigin, setToolOrigin] = useState<PetDefinition['toolOrigin']>('Claude Code');
  const [category, setCategory] = useState<PetDefinition['category']>('Cyber & AI');
  const [templateId, setTemplateId] = useState('void_cat');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const baseTemplate = PETS.find((p) => p.id === templateId) || PETS[0];
    const customPet: PetDefinition = {
      ...baseTemplate,
      id: `custom-${Date.now()}`,
      name: name.trim(),
      species: species.trim() || baseTemplate.species,
      tagline:
        tagline.trim() ||
        `Community-submitted ${species.trim() || baseTemplate.species} companion for ${toolOrigin}.`,
      description:
        tagline.trim() ||
        `Custom companion created via the Petcraft submit flow, powered by ${baseTemplate.name}'s 8fps sprite rig.`,
      category,
      toolOrigin,
      author: '@you',
      rarity: 'Legendary',
    };

    onAddPet(customPet);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="fixed inset-0 bg-page/75 backdrop-blur-sm transition-opacity" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-popup-in relative z-10 w-full max-w-md overflow-hidden rounded-sheet layer-float p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-[18px] font-medium text-ink">
              Submit a companion
            </h2>
            <p className="text-small text-ink-3">
              Add a new AI companion or tool preset to the directory.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close submit dialog"
            className="surface surface-outline grid size-8 place-items-center rounded-full text-ink-2 hover:text-ink"
          >
            <X className="size-4" />
          </button>
        </div>

        <hr className="my-4 border-t border-dashed border-line-strong" />

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-brand/15 text-brand">
              <Check className="size-6" />
            </div>
            <h3 className="mt-3 font-medium text-ink">Companion Added!</h3>
            <p className="mt-1 text-small text-ink-3">
              {name} is now live in your directory.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-small font-medium text-ink-2">
                Companion Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nova Kitsune"
                className="layer-field h-9 w-full rounded-[10px] px-3 text-body text-ink"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-small font-medium text-ink-2">
                  Species Label
                </label>
                <input
                  type="text"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  placeholder="e.g. Kitsune"
                  className="layer-field h-9 w-full rounded-[10px] px-3 text-body text-ink"
                />
              </div>
              <div>
                <label className="mb-1 block text-small font-medium text-ink-2">
                  Base Sprite Rig
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="layer-field h-9 w-full rounded-[10px] px-2.5 text-body text-ink"
                >
                  {PETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.species})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-small font-medium text-ink-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as PetDefinition['category'])}
                  className="layer-field h-9 w-full rounded-[10px] px-2.5 text-body text-ink"
                >
                  <option value="Mammals">Mammals</option>
                  <option value="Mythical">Mythical</option>
                  <option value="Cyber & AI">Cyber &amp; AI</option>
                  <option value="Aquatic & Nature">Aquatic &amp; Nature</option>
                  <option value="Avian">Avian</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-small font-medium text-ink-2">
                  Tool Ecosystem
                </label>
                <select
                  value={toolOrigin}
                  onChange={(e) => setToolOrigin(e.target.value as PetDefinition['toolOrigin'])}
                  className="layer-field h-9 w-full rounded-[10px] px-2.5 text-body text-ink"
                >
                  <option value="Claude Code">Claude Code</option>
                  <option value="VS Code Pets">VS Code Pets</option>
                  <option value="Orca CLI">Orca CLI</option>
                  <option value="Cursor IDE">Cursor IDE</option>
                  <option value="Codex Desktop">Codex Desktop</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-small font-medium text-ink-2">
                Short Description
              </label>
              <textarea
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="How does this companion help in your workflow?"
                className="layer-field w-full rounded-[10px] p-2.5 text-body text-ink"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="surface surface-outline h-8 rounded-full px-3.5 text-body font-medium text-ink-2 hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="key font-medium"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-brand" />
                  Submit Listing
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
