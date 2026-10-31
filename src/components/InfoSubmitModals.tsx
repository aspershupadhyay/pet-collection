import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { PetDefinition } from '../types/pet';
import { PETS } from '../data/pets';

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
  const [templateId, setTemplateId] = useState('miso_cat');
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
