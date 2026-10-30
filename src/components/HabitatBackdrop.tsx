import React from 'react';
import { PetHabitat } from '../types/pet';

/* Full-bleed stage backdrop shared by the inspector and the sandbox.
   Pixel habitats are bottom-anchored so the companion stands on the scene's
   ground; "Studio" falls back to a quiet dotted floor. Static layers only. */
export const HabitatBackdrop: React.FC<{ habitat: PetHabitat; tint?: string }> = ({ habitat, tint }) => {
  if (habitat === 'none') {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.075) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
            maskImage: 'radial-gradient(ellipse 75% 70% at 50% 55%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 75% 70% at 50% 55%, black 40%, transparent 100%)',
          }}
        />
        {tint && (
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(ellipse 50% 40% at 50% 62%, ${tint}26, transparent 70%)` }}
          />
        )}
        {/* Floor line */}
        <div className="absolute inset-x-0 bottom-[18%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        key={habitat}
        className="habitat-fade absolute inset-0 pixelated"
        style={{
          backgroundImage: `url(/sprites/backgrounds/${habitat}/background-dark-medium.png)`,
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center bottom',
          backgroundSize: 'auto 92%',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d10] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_70%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
};
