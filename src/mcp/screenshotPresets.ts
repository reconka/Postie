import {
  DEFAULT_SCREENSHOT_PRESETS,
  resolveScreenshotPreset,
} from '../screenshot/presetsConfig'

export function readScreenshotPresetsFromEnv(
  rawValue: string | undefined
): string[] {
  if (!rawValue || rawValue.trim().length === 0) {
    return DEFAULT_SCREENSHOT_PRESETS
  }

  const parsed = [
    ...new Set(
      rawValue
        .split(',')
        .map((value) => resolveScreenshotPreset(value)?.id)
        .filter((value): value is string => Boolean(value))
    ),
  ]

  return parsed.length > 0 ? parsed : DEFAULT_SCREENSHOT_PRESETS
}
