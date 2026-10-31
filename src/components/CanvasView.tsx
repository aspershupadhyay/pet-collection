import React, { Suspense, lazy } from 'react';
import { PetDefinition } from '../types/pet';

const World3D = lazy(() => import('../three/World3D'));

interface CanvasViewProps {
  pets: PetDefinition[];
  onSelectPet: (pet: PetDefinition) => void;
}

/* The whole collection as one little 3D world. */
export const CanvasView: React.FC<CanvasViewProps> = ({ pets, onSelectPet }) => (
  <div className="relative h-[calc(100dvh-11rem)] min-h-[30rem] w-full overflow-hidden rounded-[22px] bg-well shadow-[inset_0_0_0_1px_var(--line)] select-none">
    <Suspense
      fallback={<div className="grid h-full place-items-center text-[13px] text-ink-3">Building the world…</div>}
    >
      <World3D pets={pets} onOpen={onSelectPet} className="absolute inset-0" />
    </Suspense>

    <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[12px] text-ink-3">
      {pets.length} companions · drag to orbit · scroll to zoom · click one to open
    </p>
  </div>
);
