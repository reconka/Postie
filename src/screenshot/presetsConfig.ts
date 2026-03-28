export interface ScreenshotPresetConfig {
  id: string
  name: string
  width: number
  height: number
}

export const SUPPORTED_SCREENSHOT_PRESETS: Record<string, ScreenshotPresetConfig> = {
  'iphone-se': {
    id: 'iphone-se',
    name: 'iPhone SE',
    width: 375,
    height: 667,
  },
  'iphone-xr': {
    id: 'iphone-xr',
    name: 'iPhone XR',
    width: 414,
    height: 896,
  },
  'iphone-12-pro': {
    id: 'iphone-12-pro',
    name: 'iPhone 12 Pro',
    width: 390,
    height: 844,
  },
  'iphone-14-pro-max': {
    id: 'iphone-14-pro-max',
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
  },
  'pixel-7': {
    id: 'pixel-7',
    name: 'Pixel 7',
    width: 393,
    height: 851,
  },
  'samsung-galaxy-s8-plus': {
    id: 'samsung-galaxy-s8-plus',
    name: 'Samsung Galaxy S8+',
    width: 412,
    height: 846,
  },
  'samsung-galaxy-s20-ultra': {
    id: 'samsung-galaxy-s20-ultra',
    name: 'Samsung Galaxy S20 Ultra',
    width: 412,
    height: 915,
  },
  'samsung-galaxy-a51-71': {
    id: 'samsung-galaxy-a51-71',
    name: 'Samsung Galaxy A51/71',
    width: 360,
    height: 800,
  },
  'ipad-mini': {
    id: 'ipad-mini',
    name: 'iPad Mini',
    width: 768,
    height: 1024,
  },
  'ipad-air': {
    id: 'ipad-air',
    name: 'iPad Air',
    width: 820,
    height: 1180,
  },
  'ipad-pro': {
    id: 'ipad-pro',
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
  },
}

export const SCREENSHOT_PRESET_ALIASES: Record<string, string> = {
  desktop: 'ipad-pro',
  tablet: 'ipad-air',
  mobile: 'iphone-14-pro-max',
}

export const DEFAULT_SCREENSHOT_PRESETS = [
  'iphone-14-pro-max',
  'pixel-7',
  'ipad-air',
]

export function getSupportedScreenshotPresetIds(): string[] {
  return Object.keys(SUPPORTED_SCREENSHOT_PRESETS)
}

export function normalizeScreenshotPresetIds(input: string[]): string[] {
  const normalized = input
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .filter((value) => getSupportedScreenshotPresetIds().includes(value))

  return [...new Set(normalized)]
}

export function resolveScreenshotPreset(
  id: string
): ScreenshotPresetConfig | undefined {
  const normalized = id.trim()
  if (normalized.length === 0) {
    return undefined
  }

  const canonicalId = SCREENSHOT_PRESET_ALIASES[normalized] ?? normalized
  return SUPPORTED_SCREENSHOT_PRESETS[canonicalId]
}

