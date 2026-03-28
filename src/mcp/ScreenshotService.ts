import { chromium } from 'playwright'
import { FileEmailStore } from './FileEmailStore'
import { EmailScreenshotMetadata, ScreenshotPreset } from './types'
import {
  resolveScreenshotPreset,
  ScreenshotPresetConfig,
} from '../screenshot/presetsConfig'

export function getScreenshotPresetConfig(
  preset: ScreenshotPreset
): ScreenshotPresetConfig | undefined {
  return resolveScreenshotPreset(preset)
}

export function buildScreenshotResourceUri(
  emailId: string,
  preset: ScreenshotPreset
): string {
  return `postie://screenshots/${encodeURIComponent(
    emailId
  )}/${preset}.png`
}

export function parseScreenshotResourceUri(uri: string): {
  emailId: string
  preset: ScreenshotPreset
} {
  const parsed = new URL(uri)
  const [emailId, fileName] = parsed.pathname
    .split('/')
    .filter((segment) => segment.length > 0)

  const preset = fileName?.replace(/\.png$/, '') as ScreenshotPreset
  if (!emailId || !preset || !resolveScreenshotPreset(preset)) {
    throw new Error(`Unsupported screenshot resource URI: ${uri}`)
  }

  return {
    emailId: decodeURIComponent(emailId),
    preset,
  }
}

export class ScreenshotService {
  constructor(private readonly store: FileEmailStore) {}

  public async captureScreenshot(
    emailId: string,
    preset: ScreenshotPreset
  ): Promise<EmailScreenshotMetadata> {
    const email = this.store.getEmailFile(emailId)
    if (!email) {
      throw new Error(`Email not found: ${emailId}`)
    }

    if (!email.html || email.html.trim().length === 0) {
      throw new Error(`Email ${emailId} does not contain HTML content`)
    }

    const config = getScreenshotPresetConfig(preset)
    if (!config) {
      throw new Error(`Unsupported screenshot preset: ${preset}`)
    }

    const canonicalPreset = config.id
    const filePath = this.store.getScreenshotWriteFilePath(
      emailId,
      canonicalPreset
    )
    const browser = await chromium.launch({ headless: true })

    try {
      const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: {
          width: config.width,
          height: config.height,
        },
      })
      const page = await context.newPage()

      const sanitizedHtml = sanitizeHtmlForScreenshot(email.html)
      await page.setContent(sanitizedHtml, {
        waitUntil: 'domcontentloaded',
      })
      await page.waitForLoadState('load')
      await page.waitForLoadState('networkidle')
      await page.evaluate(async () => {
        if ('fonts' in document) {
          await document.fonts.ready
        }
      })
      await page.emulateMedia({ media: 'screen' })
      await page.screenshot({
        path: filePath,
        type: 'png',
        fullPage: true,
      })

      await context.close()
    } finally {
      await browser.close()
    }

    return {
      emailId,
      preset: canonicalPreset,
      width: config.width,
      height: config.height,
      filePath,
      resourceUri: buildScreenshotResourceUri(emailId, canonicalPreset),
      createdAt: new Date().toISOString(),
    }
  }
}

function sanitizeHtmlForScreenshot(html: string): string {
  const withoutScripts = html.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  )
  const withoutEventHandlers = withoutScripts.replace(
    /\son\w+=(".*?"|'.*?'|[^\s>]+)/gi,
    ''
  )
  return withoutEventHandlers.replace(
    /\s(href|src)\s*=\s*(["'])\s*javascript:[^"']*\2/gi,
    ' $1="#"'
  )
}
