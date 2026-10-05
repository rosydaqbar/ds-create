import type { ComponentType } from 'react';
import type { ComponentDoc } from './types';

/** Every `stories/*.doc.tsx` registers itself; no shared list to edit. */
const modules = import.meta.glob<{ default: ComponentDoc }>('./stories/*.doc.tsx', { eager: true });

const idKey = (id: string) => id.split('.').map((n) => n.padStart(3, '0')).join('.');
export const slugOf = (id: string, name: string) => `${id}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')}`;

export const componentDocs = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => idKey(a.id).localeCompare(idKey(b.id)));

export interface StaticPage {
  id: string;
  name: string;
  group: 'guidance' | 'foundations';
  load: () => Promise<{ default: ComponentType }>;
}

export const staticPages: StaticPage[] = [
  { id: '01', name: 'Getting started', group: 'guidance', load: () => import('./pages/GettingStarted') },
  { id: '02', name: 'Tokens', group: 'guidance', load: () => import('./pages/Tokens') },
  { id: '03', name: 'Changelog', group: 'guidance', load: () => import('./pages/Changelog') },
  { id: '1.1', name: 'Color', group: 'foundations', load: () => import('./pages/foundations/Color') },
  { id: '1.2', name: 'Typography', group: 'foundations', load: () => import('./pages/foundations/Typography') },
  { id: '1.3', name: 'Space & layout', group: 'foundations', load: () => import('./pages/foundations/Space') },
  { id: '1.4', name: 'Shape', group: 'foundations', load: () => import('./pages/foundations/Shape') },
  { id: '1.5', name: 'Elevation', group: 'foundations', load: () => import('./pages/foundations/Elevation') },
  { id: '1.6', name: 'Motion', group: 'foundations', load: () => import('./pages/foundations/Motion') },
  { id: '1.7', name: 'Iconography', group: 'foundations', load: () => import('./pages/foundations/Iconography') },
  { id: '1.8', name: 'Brand assets', group: 'foundations', load: () => import('./pages/foundations/BrandAssets') },
];

export const levelLabel = { guidance: 'Guidance', foundations: 'Foundations', parts: 'Parts', components: 'Components', sections: 'Sections', layouts: 'Layouts', screens: 'Screens' } as const;
