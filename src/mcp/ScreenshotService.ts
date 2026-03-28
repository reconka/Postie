import { FileEmailStore } from './FileEmailStore'
import { EmailScreenshotMetadata, ScreenshotPreset } from './types'
import {
  resolveScreenshotPreset,
  ScreenshotPresetConfig,
} from '../screenshot/presetsConfig'
import sanitizeHtml from 'sanitize-html'

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
    let chromium: typeof import('playwright').chromium
    try {
      ;({ chromium } = await import('playwright'))
    } catch (error) {
      throw new Error(
        'Playwright is required for screenshot capture. Install it with `npm install playwright` and run `npx playwright install chromium`.'
      )
    }

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
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'table',
      'thead',
      'tbody',
      'tfoot',
      'tr',
      'td',
      'th',
      'colgroup',
      'col',
      'img',
      'span',
      'div',
    ]),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      td: ['colspan', 'rowspan', 'align', 'valign'],
      th: ['colspan', 'rowspan', 'align', 'valign'],
      table: ['width', 'cellpadding', 'cellspacing', 'border', 'align'],
      '*': ['class', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: true,
    disallowedTagsMode: 'discard',
  })
}
