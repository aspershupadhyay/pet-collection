import { asset } from '../utils/asset';
import React, { useEffect, useRef, useState } from 'react';
import { PETS } from '../data/pets';
import { BRAND } from '../collection';

interface InfoPageProps {
  onOpenSubmit: () => void;
  /** Scroll straight to the sponsor section on mount (sidebar "Become a sponsor"). */
  focusSponsor?: boolean;
}

/* Edit these before launch — placeholder pricing and contact. */
const SPONSOR_EMAIL = BRAND.sponsorEmail;
const SPONSOR_PLACEMENTS = [
  {
    id: 'sidebar',
    name: 'Sidebar card',
    price: '$79',
    body: 'A card in the sidebar rotation on every page, with your icon, a line of copy and a link.',
  },
  {
    id: 'header',
    name: 'Top bar icon',
    price: '$49',
    body: 'Your icon in the top bar next to Submit, one click from your site.',
  },
  {
    id: 'featured',
    name: 'Featured companion',
    price: '$149',
    body: 'A companion drawn in your brand colours, pinned first on the wall for the week.',
  },
] as const;

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: `What is ${BRAND.name}?`,
    a: 'A premium collection of animated pixel characters, cursor sets, terminal themes and packs for the tools you code in. Every character ships with a full set of moves, several coats and ready-made configs for Claude Code /buddy, VS Code Pets, Orca CLI, Cursor and React.',
  },
  {
    q: 'How do I install something?',
    a: 'Open any card. Characters export to your editor or terminal tool, themes to Ghostty, Kitty, Alacritty, WezTerm, Windows Terminal and VS Code, and cursor sets to CSS or SVG. Packs download as one file with everything inside.',
  },
  {
    q: 'Why do the cards keep moving?',
    a: 'Each card plays a short loop of what that pet actually does: waiting by your prompt, patrolling, swatting bugs, celebrating a green build. The bars at the top show where you are in the loop. Open a card when you want to control the pet yourself.',
  },
  {
    q: 'Can I submit my own companion?',
    a: 'Yes. Use Submit in the top bar. Your companion appears in your collection straight away, built on one of the existing sprite rigs.',
  },
  {
    q: 'Do I need an account?',
    a: 'Not to browse. Favourites and folders are saved in this browser. To post in the Showcase you sign in with an email link or GitHub, so every submission has a real person behind it.',
  },
  {
    q: 'Can I use it as an app?',
    a: 'Yes. Open Settings and choose Install app. The app shell works offline, and each pet you have already viewed stays available without a connection.',
  },
  {
    q: 'How are paid placements identified?',
    a: 'Every sponsored slot is labelled Sponsored. Sponsors never decide which companions are in the collection or how they are ordered.',
  },
];

/* Three companions taking a slow walk under the title. */
const STROLLERS = [
  { id: 'akita_inu', ms: 26000, delay: 0 },
  { id: 'miso_cat', ms: 31000, delay: -12000 },
  { id: 'kitsune_fox', ms: 23000, delay: -19000 },
];

const StrollTrack: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [trackWidth, setTrackWidth] = useState(640);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver(([entry]) => setTrackWidth(entry.contentRect.width));
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="relative mx-auto mt-10 h-14 w-full max-w-[44rem] overflow-hidden border-b border-dashed border-line-strong"
      style={{
        '--track-w': `${trackWidth}px`,
        WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
        maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)',
      } as React.CSSProperties}
    >
      {STROLLERS.map((s) => {
        const pet = PETS.find((p) => p.id === s.id);
        if (!pet) return null;
        return (
          <img
            key={s.id}
            src={pet.sprites.walk}
            alt=""
            width={44}
            height={44}
            className="stroll pixelated absolute bottom-0 left-0 size-11 object-contain object-bottom"
            style={{ '--stroll-ms': `${s.ms}ms`, '--stroll-delay': `${s.delay}ms` } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
};

const PlacementPreview: React.FC<{ id: (typeof SPONSOR_PLACEMENTS)[number]['id'] }> = ({ id }) => {
  if (id === 'sidebar') {
    return (
      <div className="w-[9.5rem] rounded-[10px] bg-page p-2 shadow-[inset_0_0_0_1px_var(--line)]">
        <div className="flex items-center gap-1.5">
          <span className="grid size-4 place-items-center rounded-[5px] border border-dashed border-brand/70 text-[9px] text-brand">+</span>
          <div className="flex flex-col gap-0.5">
            <span className="h-1.5 w-12 rounded-full bg-ink/70" />
            <span className="h-1 w-7 rounded-full bg-ink/25" />
          </div>
        </div>
        <span className="mt-2 block h-1 w-full rounded-full bg-ink/15" />
        <span className="mt-1 block h-1 w-4/5 rounded-full bg-ink/15" />
        <span className="mt-2 block h-3.5 w-full rounded-full bg-brand/85" />
      </div>
    );
  }
  if (id === 'header') {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-page px-2 py-1.5 shadow-[inset_0_0_0_1px_var(--line)]">
        <span className="size-4 rounded-[5px] bg-ink/15" />
        <span className="size-4 rounded-[5px] bg-ink/15" />
        <span className="grid size-4 place-items-center rounded-[5px] border border-dashed border-brand/70 text-[9px] text-brand">+</span>
        <span className="ml-1 h-4 w-11 rounded-full bg-ink/80" />
      </div>
    );
  }
  return (
    <div className="pc-tier-legendary relative h-[4.6rem] w-[5.6rem] overflow-hidden rounded-[10px] bg-page shadow-[inset_0_0_0_1px_var(--line)]">
      <div className="pc-foil-ring" />
      <span className="absolute left-1.5 top-1.5 font-mono text-[7px] uppercase tracking-[0.14em] text-[#f0a92e]">Featured</span>
      <img src={asset('/sprites/fox/red_idle_8fps.gif')} alt="" className="pixelated absolute bottom-1 left-1/2 size-10 -translate-x-1/2 object-contain" />
    </div>
  );
};

export const InfoPage: React.FC<InfoPageProps> = ({ onOpenSubmit, focusSponsor }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const sponsorRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (focusSponsor) {
      sponsorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [focusSponsor]);

  const scrollToSponsor = (e: React.MouseEvent) => {
    e.preventDefault();
    sponsorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const inlineLink =
    'font-medium text-ink underline decoration-line-strong decoration-1 underline-offset-[5px] transition-colors hover:decoration-ink';

  return (
    <div className="pb-24">
      {/* Title */}
      <header className="mx-auto max-w-[36rem] pt-14 text-center sm:pt-20">
        <h1 className="font-display text-[28px] font-medium leading-[1.15] tracking-[-0.02em] text-ink sm:text-[32px]">
          About {BRAND.name}
        </h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-pretty text-ink-3">
          {BRAND.description}
        </p>
      </header>

      <StrollTrack />

      <div className="mx-auto mt-14 flex max-w-[44rem] flex-col gap-16">
        {/* How it's made */}
        <section aria-labelledby="info-approach">
          <h2 id="info-approach" className="font-display text-[17px] font-medium text-ink">
            How the collection is made
          </h2>
          <div className="mt-4 space-y-4 text-[15px] leading-[1.75] text-ink-3">
            <p>
              Every companion is drawn frame by frame at 8fps and reviewed before it joins: it needs a clear personality, clean pixels and a full set of moves. Inclusion is editorial, and not every submission is accepted.
            </p>
            <p>
              Each card plays a short loop of what that pet actually does, so you can read its character at a glance. Open one to try its moves, change its coat and copy a config for your tool. Keep the ones you like in Favourites or sort them into Folders.
            </p>
            <p>
              <button type="button" onClick={onOpenSubmit} className={inlineLink}>
                Submitting a companion
              </button>{' '}
              is free. Every{' '}
              <a href="#sponsor" onClick={scrollToSponsor} className={inlineLink}>
                sponsor slot
              </a>{' '}
              is a promotional product: it is always labelled and never influences which companions make the collection.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="info-faq">
          <h2 id="info-faq" className="font-display text-[17px] font-medium text-ink">
            Frequently asked questions
          </h2>
          <div className="mt-4 overflow-hidden rounded-[22px] bg-well shadow-[inset_0_0_0_1px_var(--line)]">
            {FAQ.map((item, i) => {
              const isOpen = openFaq === i;
              const panelId = `faq-panel-${i}`;
              return (
                <div key={item.q} className={i > 0 ? 'border-t border-line' : ''}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-6 py-[18px] text-left text-[15px] text-ink transition-colors hover:bg-wash"
                    >
                      <span>{item.q}</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className={`shrink-0 text-ink-3 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      >
                        <polyline points="4,6 8,10 12,6" />
                      </svg>
                    </button>
                  </h3>
                  <div id={panelId} role="region" className="faq-panel" data-open={isOpen}>
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-[14.5px] leading-[1.7] text-ink-3">{item.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sponsor */}
        <section id="sponsor" ref={sponsorRef} aria-labelledby="info-sponsor" className="scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-[30rem]">
              <h2 id="info-sponsor" className="font-display text-[17px] font-medium text-ink">
                Sponsor {BRAND.name}
              </h2>
              <p className="mt-2 text-[15px] leading-[1.7] text-ink-3">
                Put your product in front of people who build with AI tools every day. One sponsor per slot, booked by the week.
              </p>
            </div>
            <a
              href={`mailto:${SPONSOR_EMAIL}?subject=${encodeURIComponent(`${BRAND.name} sponsorship`)}`}
              className="surface surface-primary inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-body font-medium text-white"
            >
              Book a slot
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6.65s6.94-.54 7.92.43c.97.98.43 7.92.43 7.92M16.5 7.5l-10 10" />
              </svg>
            </a>
          </div>

          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {SPONSOR_PLACEMENTS.map((p) => (
              <li key={p.id} className="flex flex-col rounded-[20px] bg-well p-2 shadow-[inset_0_0_0_1px_var(--line)]">
                <div className="grid h-28 place-items-center rounded-[14px] bg-[color-mix(in_srgb,var(--ink)_3%,transparent)]">
                  <PlacementPreview id={p.id} />
                </div>
                <div className="flex flex-1 flex-col px-2.5 pt-3 pb-2">
                  <h3 className="text-[14px] font-medium text-ink">{p.name}</h3>
                  <p className="mt-0.5 font-mono text-[12px] tabular-nums text-ink">
                    {p.price}
                    <span className="text-ink-3"> / week</span>
                  </p>
                  <p className="mt-1.5 text-[13px] leading-[1.55] text-ink-3">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-3">
            <span>Always labelled Sponsored</span>
            <span aria-hidden="true">·</span>
            <span>Never affects curation</span>
            <span aria-hidden="true">·</span>
            <span>Weekly, cancel any time</span>
          </p>
        </section>
      </div>
    </div>
  );
};
