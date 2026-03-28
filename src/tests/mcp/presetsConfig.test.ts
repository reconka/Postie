import {
  getSupportedScreenshotPresetIds,
  resolveScreenshotPreset,
} from '../../screenshot/presetsConfig'

describe('screenshot presets config', () => {
  test('resolves legacy aliases to canonical presets', () => {
    expect(resolveScreenshotPreset('mobile')?.id).toBe('iphone-14-pro-max')
    expect(resolveScreenshotPreset('tablet')?.id).toBe('ipad-air')
    expect(resolveScreenshotPreset('desktop')?.id).toBe('ipad-pro')
  })

  test('resolves canonical IDs with expected dimensions', () => {
    expect(resolveScreenshotPreset('iphone-se')).toMatchObject({
      id: 'iphone-se',
      width: 375,
      height: 667,
    })
    expect(resolveScreenshotPreset('ipad-pro')).toMatchObject({
      id: 'ipad-pro',
      width: 1024,
      height: 1366,
    })
  })

  test('rejects invalid preset IDs', () => {
    expect(resolveScreenshotPreset('not-a-preset')).toBeUndefined()
  })

  test('supported preset IDs include canonical entries only', () => {
    const ids = getSupportedScreenshotPresetIds()
    expect(ids).toContain('iphone-se')
    expect(ids).toContain('ipad-air')
    expect(ids).not.toContain('mobile')
  })
})

