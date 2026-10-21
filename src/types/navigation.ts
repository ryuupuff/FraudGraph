export type NavItemKey = 'overview' | 'explorer' | 'investigations' | 'analytics';

export interface NavItem {
  key: NavItemKey;
  label: string;
  description: string;
}
