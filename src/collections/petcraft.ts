import type { CollectionConfig } from './types';

const config: CollectionConfig = {
  id: 'petcraft',
  brand: {
    name: 'Petcraft',
    wordmark: 'petcraft',
    tagline: 'Premium pixel characters for the tools you code in.',
    intro: 'A premium collection of pixel characters, cursors and terminal themes for the tools you build in.',
    description:
      'Petcraft is a curated collection of animated pixel characters, cursor sets, terminal themes and sprite packs for Claude Code, Cursor, VS Code and your terminal.',
    sponsorEmail: 'sponsor@petcraft.xyz',
    contactEmail: 'hello@petcraft.xyz',
  },
  sections: ['all', 'characters', 'cursors', 'themes', 'packs', 'showcase'],
  kinds: ['character', 'cursor', 'theme', 'pack'],
  heroes: {
    all: {
      title: 'A living collection of pixel characters.',
      subtitle: 'Characters, cursors, terminal themes and packs, all made to sit next to your code. Open anything to make it yours.',
    },
    characters: {
      title: 'Every character, always moving.',
      subtitle: 'Each card loops through what that character does. Open one to turn it in 3D and copy it into your tool.',
    },
    cursors: {
      title: 'Cursors with a little personality.',
      subtitle: 'Eight pixel cursor sets in one house palette. Hover a card to try it, or wear one across the whole site.',
    },
    themes: {
      title: 'Terminal themes that feel like home.',
      subtitle: 'Sixteen-colour schemes for six terminals. Open one to preview it with any character and cursor before you install.',
    },
    packs: {
      title: 'Packs that go together.',
      subtitle: 'Characters bundled with the theme and cursor that suit them, ready to install in one go.',
    },
    showcase: {
      title: 'Made by the community.',
      subtitle: 'Characters, setups and screen recordings people built with Petcraft. Sign in to add yours.',
    },
    favourites: { title: 'Your favourites.', subtitle: 'Everything you starred, saved in this browser.' },
    folders: { title: 'Your folders.', subtitle: 'Group characters, cursors and themes by project or mood.' },
  },
  featured: [
    { key: 'void_cat', title: 'Socrates', label: 'Character of the week', description: 'The night-shift cat. Naps on your build, wakes up for the bugs.' },
    { key: 'theme:rustacean', title: 'Rustacean', label: 'New theme', description: 'Ferris red on ocean slate, with configs for six terminals.' },
    { key: 'cursor:quack', title: 'Quack', label: 'New cursor set', description: 'A rubber-duck cursor that points at the bug for you.' },
    { key: '', title: 'Your product here', label: 'Open slot', description: 'Put your product in front of people who build with AI tools every day.' },
  ],
  sponsorPlacements: [
    { name: 'Sidebar card', price: '$79 / week', detail: 'A rotating card in the sidebar on every page.' },
    { name: 'Top bar icon', price: '$49 / week', detail: 'Your icon in the header, next to search.' },
    { name: 'Featured character', price: '$149 / week', detail: 'A character drawn for your product, pinned to the top of the wall.' },
  ],
};

export default config;
