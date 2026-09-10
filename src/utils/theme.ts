import { ThemeColorKey } from '../types';

export interface ThemeColors {
  primaryHex: string;
  lightHex: string;
  borderHex: string;
  darkHex: string;
  text: string;
  textDark: string;
  bgLight: string;
  bgSubtle: string;
  bgSolid: string;
  border: string;
  borderLight: string;
  ring: string;
  gradient: string;
}

export const getThemeClasses = (colorKey: ThemeColorKey = 'blue'): ThemeColors => {
  switch (colorKey) {
    case 'indigo':
      return {
        primaryHex: '#4f46e5',
        lightHex: '#eef2ff',
        borderHex: '#c7d2fe',
        darkHex: '#3730a3',
        text: 'text-indigo-600',
        textDark: 'text-indigo-800',
        bgLight: 'bg-indigo-50',
        bgSubtle: 'bg-indigo-50/70',
        bgSolid: 'bg-indigo-600',
        border: 'border-indigo-200',
        borderLight: 'border-indigo-100',
        ring: 'ring-indigo-500',
        gradient: 'from-indigo-600 to-blue-700'
      };
    case 'emerald':
      return {
        primaryHex: '#059669',
        lightHex: '#ecfdf5',
        borderHex: '#a7f3d0',
        darkHex: '#065f46',
        text: 'text-emerald-600',
        textDark: 'text-emerald-800',
        bgLight: 'bg-emerald-50',
        bgSubtle: 'bg-emerald-50/70',
        bgSolid: 'bg-emerald-600',
        border: 'border-emerald-200',
        borderLight: 'border-emerald-100',
        ring: 'ring-emerald-500',
        gradient: 'from-emerald-600 to-teal-700'
      };
    case 'amber':
      return {
        primaryHex: '#d97706',
        lightHex: '#fffbeb',
        borderHex: '#fde68a',
        darkHex: '#92400e',
        text: 'text-amber-600',
        textDark: 'text-amber-800',
        bgLight: 'bg-amber-50',
        bgSubtle: 'bg-amber-50/70',
        bgSolid: 'bg-amber-600',
        border: 'border-amber-200',
        borderLight: 'border-amber-100',
        ring: 'ring-amber-500',
        gradient: 'from-amber-600 to-orange-700'
      };
    case 'rose':
      return {
        primaryHex: '#e11d48',
        lightHex: '#fff1f2',
        borderHex: '#fecdd3',
        darkHex: '#9f1239',
        text: 'text-rose-600',
        textDark: 'text-rose-800',
        bgLight: 'bg-rose-50',
        bgSubtle: 'bg-rose-50/70',
        bgSolid: 'bg-rose-600',
        border: 'border-rose-200',
        borderLight: 'border-rose-100',
        ring: 'ring-rose-500',
        gradient: 'from-rose-600 to-pink-700'
      };
    case 'slate':
      return {
        primaryHex: '#334155',
        lightHex: '#f1f5f9',
        borderHex: '#cbd5e1',
        darkHex: '#0f172a',
        text: 'text-slate-700',
        textDark: 'text-slate-900',
        bgLight: 'bg-slate-100',
        bgSubtle: 'bg-slate-100/70',
        bgSolid: 'bg-slate-800',
        border: 'border-slate-300',
        borderLight: 'border-slate-200',
        ring: 'ring-slate-500',
        gradient: 'from-slate-700 to-slate-900'
      };
    case 'blue':
    default:
      return {
        primaryHex: '#2563eb',
        lightHex: '#eff6ff',
        borderHex: '#bfdbfe',
        darkHex: '#1e40af',
        text: 'text-blue-600',
        textDark: 'text-blue-800',
        bgLight: 'bg-blue-50',
        bgSubtle: 'bg-blue-50/70',
        bgSolid: 'bg-blue-600',
        border: 'border-blue-200',
        borderLight: 'border-blue-100',
        ring: 'ring-blue-500',
        gradient: 'from-blue-600 to-indigo-700'
      };
  }
};

/**
 * Injects CSS Custom Properties on the document element so any element or icon
 * can dynamically read the selected agency theme color.
 */
export const applyThemeCSS = (colorKey: ThemeColorKey = 'blue') => {
  if (typeof document === 'undefined') return;
  const theme = getThemeClasses(colorKey);
  const root = document.documentElement;
  root.style.setProperty('--theme-color', theme.primaryHex);
  root.style.setProperty('--theme-color-light', theme.lightHex);
  root.style.setProperty('--theme-color-border', theme.borderHex);
  root.style.setProperty('--theme-color-dark', theme.darkHex);
  root.setAttribute('data-theme-color', colorKey);
  root.setAttribute('data-theme-active', 'true');
};
