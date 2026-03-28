import { readCompatibilityClientsFromEnv } from '../../mcp/compatibilityClients'
import { readScreenshotPresetsFromEnv } from '../../mcp/screenshotPresets'
import {
  DEFAULT_COMPATIBILITY_CLIENTS,
  SUPPORTED_COMPATIBILITY_CLIENTS,
  getInvalidCompatibilityClients,
  normalizeCompatibilityClients,
} from '../../compatibility/clientsConfig'
import { DEFAULT_SCREENSHOT_PRESETS } from '../../screenshot/presetsConfig'

describe('compatibility clients config', () => {
  test('normalizes, trims, and de-duplicates client list', () => {
    expect(
      normalizeCompatibilityClients([
        ' gmail.ios ',
        'outlook.windows',
        'gmail.ios',
        '',
      ])
    ).toEqual(['gmail.ios', 'outlook.windows'])
  })

  test('detects invalid compatibility clients', () => {
    expect(
      getInvalidCompatibilityClients([
        'gmail.ios',
        'apple.mail.mac',
        'outlook.windows',
      ])
    ).toEqual(['apple.mail.mac'])
  })

  test('defaults are subset of supported client list', () => {
    const supported = new Set(SUPPORTED_COMPATIBILITY_CLIENTS)
    expect(
      DEFAULT_COMPATIBILITY_CLIENTS.every((client) => supported.has(client))
    ).toBe(true)
  })
})

describe('readCompatibilityClientsFromEnv', () => {
  test('uses shared default list when env is missing', () => {
    expect(readCompatibilityClientsFromEnv(undefined)).toEqual(
      DEFAULT_COMPATIBILITY_CLIENTS
    )
  })

  test('uses shared default list when env is empty', () => {
    expect(readCompatibilityClientsFromEnv('   ')).toEqual(
      DEFAULT_COMPATIBILITY_CLIENTS
    )
  })

  test('parses and normalizes env list when provided', () => {
    expect(
      readCompatibilityClientsFromEnv(
        ' gmail.ios , outlook.windows , gmail.ios '
      )
    ).toEqual(['gmail.ios', 'outlook.windows'])
  })
})

describe('readScreenshotPresetsFromEnv', () => {
  test('uses shared screenshot defaults when env is missing', () => {
    expect(readScreenshotPresetsFromEnv(undefined)).toEqual(
      DEFAULT_SCREENSHOT_PRESETS
    )
  })

  test('uses shared screenshot defaults when env is empty', () => {
    expect(readScreenshotPresetsFromEnv('   ')).toEqual(
      DEFAULT_SCREENSHOT_PRESETS
    )
  })

  test('parses, normalizes and filters screenshot preset ids', () => {
    expect(
      readScreenshotPresetsFromEnv(
        ' iphone-se , pixel-7 , pixel-7 , invalid-value '
      )
    ).toEqual(['iphone-se', 'pixel-7'])
  })

  test('resolves legacy screenshot aliases to canonical ids', () => {
    expect(readScreenshotPresetsFromEnv('mobile, tablet, desktop')).toEqual([
      'iphone-14-pro-max',
      'ipad-air',
      'ipad-pro',
    ])
  })
})
