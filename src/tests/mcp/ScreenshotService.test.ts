import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { FileEmailStore } from '../../mcp/FileEmailStore'
import {
  buildScreenshotResourceUri,
  getScreenshotPresetConfig,
  parseScreenshotResourceUri,
  ScreenshotService,
} from '../../mcp/ScreenshotService'

jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn(),
  },
}))

describe('ScreenshotService helpers', () => {
  test('getScreenshotPresetConfig resolves canonical preset IDs', () => {
    expect(getScreenshotPresetConfig('iphone-se')).toEqual({
      id: 'iphone-se',
      name: 'iPhone SE',
      width: 375,
      height: 667,
    })
    expect(getScreenshotPresetConfig('iphone-14-pro-max')).toEqual({
      id: 'iphone-14-pro-max',
      name: 'iPhone 14 Pro Max',
      width: 430,
      height: 932,
    })
  })

  test('getScreenshotPresetConfig resolves legacy aliases', () => {
    expect(getScreenshotPresetConfig('mobile')?.id).toBe('iphone-14-pro-max')
    expect(getScreenshotPresetConfig('tablet')?.id).toBe('ipad-air')
    expect(getScreenshotPresetConfig('desktop')?.id).toBe('ipad-pro')
  })

  test('getScreenshotPresetConfig rejects unsupported IDs', () => {
    expect(getScreenshotPresetConfig('unknown')).toBeUndefined()
  })

  test('screenshot resource URIs round-trip for canonical IDs', () => {
    const uri = buildScreenshotResourceUri('email-42', 'iphone-14-pro-max')

    expect(parseScreenshotResourceUri(uri)).toEqual({
      emailId: 'email-42',
      preset: 'iphone-14-pro-max',
    })
  })
})

describe('ScreenshotService', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'postie-screenshots-'))
  const store = new FileEmailStore(tempRoot)
  const service = new ScreenshotService(store)

  afterAll(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  })

  test('captureScreenshot rejects unknown emails', async () => {
    await expect(
      service.captureScreenshot('missing', 'iphone-se')
    ).rejects.toThrow('Email not found: missing')
  })

  test('captureScreenshot rejects emails without html', async () => {
    store.storeEmailFile({
      id: 'text-only',
      receivedDateTime: new Date().toISOString(),
      subject: 'No html',
      from: 'from@example.com',
      to: 'to@example.com',
      cc: '',
      bcc: '',
      text: 'Only text',
      html: '',
      source: 'raw',
      attachments: [],
    })

    await expect(
      service.captureScreenshot('text-only', 'iphone-se')
    ).rejects.toThrow('Email text-only does not contain HTML content')
  })
})
