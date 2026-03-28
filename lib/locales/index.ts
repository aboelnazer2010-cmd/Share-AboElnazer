import { en } from './en';
import { ar } from './ar';

export type Locale = typeof en;
export const dict: Record<'en' | 'ar', Locale> = { en, ar };
