export const TAB_IDS = [
  'mobile',
  'tablet',
  'desktop',
  'text-only',
  'compatibility',
] as const

export type TabId = (typeof TAB_IDS)[number]

export function mapDefaultTab(value: string): TabId {
  return TAB_IDS.includes(value as TabId) ? (value as TabId) : 'desktop'
}
