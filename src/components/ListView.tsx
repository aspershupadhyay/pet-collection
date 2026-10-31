import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { PetDefinition } from '../types/pet';
import { getShowreel } from '../data/showreel';
import { RARITY_COLOR } from './PetCard';
import { ArrowUpRight } from 'lucide-react';

const Voxel3D = lazy(() => import('../three/Voxel3D'));

interface ListViewProps {
  pets: PetDefinition[];
  bookmarks: string[];
  onSelectPet: (pet: PetDefinition) => void;
}

/* Directory + live preview. Hovering or arrowing through the list previews a
   companion in 3D; clicking opens it. Nothing to configure on the way. */
export const ListView: React.FC<ListViewProps> = ({ pets, bookmarks, onSelectPet }) => {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [moment, setMoment] = useState(0);
  const preview = pets.find((p) => p.id === previewId) ?? null;
  const reel = useMemo(() => (preview ? getShowreel(preview) : []), [preview]);

  useEffect(() => setMoment(0), [previewId]);

  return (
    <div className="-mx-[16px] flex border-t border-dashed border-line-strong">
      <ul className="scrollbar-none h-[calc(100dvh-11rem)] w-full shrink-0 overflow-y-auto p-2.5 lg:w-[19rem] lg:border-r lg:border-dashed lg:border-line-strong">
        {pets.map((pet) => {
          const active = pet.id === previewId;
          return (
            <li key={pet.id}>
              <button
                type="button"
                onMouseEnter={() => setPreviewId(pet.id)}
                onFocus={() => setPreviewId(pet.id)}
                onClick={() => onSelectPet(pet)}
                className={`flex w-full items-center gap-2.5 rounded-[10px] py-2 pr-2 pl-2.5 text-left transition-colors ${
                  active ? 'bg-well text-ink' : 'text-ink-2 hover:text-ink'
                }`}
              >
                <span
                  className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-full"
                  style={{ background: `color-mix(in srgb, ${pet.primaryColor} 16%, var(--well))` }}
                >
                  <img src={pet.sprites.idle} alt="" className="pixelated size-5 object-contain" />
                </span>
                <span className="flex-1 truncate text-[13px]">{pet.name}</span>
                {bookmarks.includes(pet.id) && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#f5b400" aria-label="Favourite">
                    <path d="M12 3.2l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.5l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85z" />
                  </svg>
                )}
                <span className="size-1.5 shrink-0 rotate-45" style={{ backgroundColor: RARITY_COLOR[pet.rarity] }} title={pet.rarity} />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="relative h-[calc(100dvh-11rem)] min-w-0 flex-1 p-3 max-lg:hidden">
        {preview ? (
          <div
            className="relative h-full overflow-hidden rounded-[22px]"
            style={{ background: `color-mix(in srgb, ${preview.primaryColor} 12%, var(--well))` }}
          >
            <Suspense fallback={null}>
              <Voxel3D pet={preview} onMoment={setMoment} className="absolute inset-0" />
            </Suspense>
            <div className="pointer-events-none absolute inset-x-5 top-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-[20px] font-medium text-ink">{preview.name}</h2>
                <p className="mt-0.5 text-[13px] text-ink-3">{preview.species}</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectPet(preview)}
                className="surface surface-outline pointer-events-auto inline-flex h-8 items-center gap-1 rounded-full px-3.5 text-[13px] font-medium text-ink"
              >
                Open <ArrowUpRight className="size-3.5" />
              </button>
            </div>
            <p className="absolute bottom-4 left-5 font-mono text-[12px] text-ink-2">
              <span key={`${preview.id}-${moment}`} className="pc-caption inline-block">
                {reel[moment % reel.length]?.caption}
              </span>
            </p>
          </div>
        ) : (
          <div className="grid h-full place-items-center rounded-[22px] border border-dashed border-line-strong text-center">
            <div>
              <p className="font-display text-[15px] font-medium text-ink">Hover a companion to preview it</p>
              <p className="mt-1 text-[13px] text-ink-3">It appears here in 3D. Drag to turn it, click its name to open.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
