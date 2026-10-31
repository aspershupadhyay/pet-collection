/* Realistic characters, built on the quadruped rig. */
import { drawQuadruped, renderQuadruped, REAL_ACTIONS } from './realistic.mjs';

const eyes = { pupil: '#120c08', shine: '#ffffff', line: '#2a160c', nose: '#d9867e', mouth: '#5a2424', whisker: '#f6efe6', ball: '#e2574c', ballline: '#fbe3c4', pink: '#e8a29a' };

export const REAL_CAST = [
  {
    id: 'cha_cat',
    folder: 'cha',
    // Cha: a big ginger tabby tom — broad head, jowls, white socks and bib
    variants: {
      ginger: {
        size: 1.05, headR: 1.22, jowls: true, hipR: 1.05, length: 0.84,
        coat: { stripes: true, socks: 15 },
        outline: '#3a1a08',
        ramps: {
          fur: ['#7a3612', '#b85f27', '#e0893f', '#f5b06a'],
          dark: ['#5a2408', '#8a3e14', '#b25c22', '#c97a3a'],
          light: ['#b39478', '#d9bd9c', '#f2e2c9', '#fff6e8'],
        },
        flat: { ...eyes, iris: '#e3a42b' },
      },
      smoke: {
        size: 1.05, headR: 1.22, jowls: true, hipR: 1.05, length: 0.84,
        coat: { stripes: true, socks: 15 },
        outline: '#14161c',
        ramps: {
          fur: ['#33363f', '#555a66', '#7c8290', '#a4aab6'],
          dark: ['#1d1f26', '#2f323a', '#454953', '#5a5e69'],
          light: ['#9a9ca3', '#c4c6cc', '#e6e7ea', '#fbfbfc'],
        },
        flat: { ...eyes, iris: '#d8b43a' },
      },
    },
  },
  {
    id: 'chi_cat',
    folder: 'chi',
    // Chi: a slim brown spotted cat with rosettes and green eyes
    variants: {
      spotted: {
        size: 0.95, headR: 1.1, tailR: 2.2, length: 0.86,
        coat: { spots: true },
        outline: '#2a1608',
        ramps: {
          fur: ['#6b4220', '#a06a34', '#cf9852', '#ebc184'],
          dark: ['#22140a', '#3a2412', '#55361c', '#6b4626'],
          rosette: ['#7a4a22', '#9a5f2c', '#b87a3c', '#cc8f4c'],
          light: ['#b39a78', '#d6c09c', '#efe0c4', '#fbf3e3'],
        },
        flat: { ...eyes, iris: '#8fbf3a' },
      },
      snow: {
        size: 0.95, headR: 1.1, tailR: 2.2, length: 0.86,
        coat: { spots: true },
        outline: '#262630',
        ramps: {
          fur: ['#8d8b8a', '#bdb8b1', '#e0dbd2', '#f7f3ec'],
          dark: ['#2c2b30', '#45434a', '#5d5a61', '#727077'],
          rosette: ['#9c938a', '#b2a89c', '#c6bcae', '#d6ccbe'],
          light: ['#b8b6b3', '#dad8d4', '#f0eeea', '#ffffff'],
        },
        flat: { ...eyes, iris: '#6fb7e8' },
      },
    },
  },
];

export const realFrames = (spec, action) => REAL_ACTIONS[action].map((P) => renderQuadruped(drawQuadruped(spec, P), spec));
export { REAL_ACTIONS };
