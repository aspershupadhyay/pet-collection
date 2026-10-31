import type { CollectionConfig } from './types';

/* A second site on the same shell: a community showcase first, with the
   house themes and cursors as editor's picks. Build it with
   VITE_COLLECTION=folio npm run build */
const config: CollectionConfig = {
  id: 'folio',
  brand: {
    name: 'Folio',
    wordmark: 'folio',
    tagline: 'A showcase of setups, sprites and screens people love.',
    intro: 'A hand-picked showcase of developer setups, pixel work and the details that make them feel good.',
    description: 'Folio is a curated showcase of developer setups, terminal themes, cursors and pixel work, submitted by the people who made them.',
    sponsorEmail: 'sponsor@folio.example',
    contactEmail: 'hello@folio.example',
  },
  sections: ['showcase', 'themes', 'cursors'],
  kinds: ['theme', 'cursor'],
  heroes: {
    showcase: {
      title: 'Setups worth stealing from.',
      subtitle: 'Screens, recordings and pixel work from the community. Sign in to submit yours.',
    },
    themes: { title: 'Editor’s picks: terminal themes.', subtitle: 'Colour schemes we keep coming back to.' },
    cursors: { title: 'Editor’s picks: cursors.', subtitle: 'Small details that make a screen feel yours.' },
    favourites: { title: 'Your favourites.', subtitle: 'Saved in this browser.' },
    folders: { title: 'Your folders.', subtitle: 'Group picks by project or mood.' },
  },
  featured: [
    { key: 'theme:celestial', title: 'Celestial', label: 'Editor’s pick', description: 'Indigo night with lilac and rose accents.' },
    { key: '', title: 'Your product here', label: 'Open slot', description: 'Reach people who care how their tools look.' },
  ],
  sponsorPlacements: [
    { name: 'Sidebar card', price: '$59 / week', detail: 'A rotating card in the sidebar on every page.' },
    { name: 'Pinned showcase', price: '$129 / week', detail: 'Your work pinned to the top of the showcase.' },
  ],
};

export default config;
