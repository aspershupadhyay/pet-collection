// Resolved at build time from VITE_COLLECTION (see vite.config.ts).
import config from '@collection';
import type { CollectionConfig } from './collections/types';

export const COLLECTION: CollectionConfig = config;
export const BRAND = config.brand;
