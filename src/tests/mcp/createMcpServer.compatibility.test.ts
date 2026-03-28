import * as os from 'os'
import * as path from 'path'
import * as fs from 'fs'
import { FileEmailStore } from '../../mcp/FileEmailStore'
import { createPostieMcpServer } from '../../mcp/createMcpServer'
import { ScreenshotService } from '../../mcp/ScreenshotService'
import {
  DEFAULT_COMPATIBILITY_CLIENTS,
  SUPPORTED_COMPATIBILITY_CLIENTS,
} from '../../compatibility/clientsConfig'
import {
  DEFAULT_SCREENSHOT_PRESETS,
  SCREENSHOT_PRESET_ALIASES,
  getSupportedScreenshotPresetIds,
} from '../../screenshot/presetsConfig'

const tools: Record<string, { config: any; handler: (...args: any[]) => Promise<any> }> = {}

jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: class {
    registerTool(name: string, config: any, handler: (...args: any[]) => Promise<any>) {
      tools[name] = { config, handler }
    }
    registerResource() {
      return
    }
  },
  ResourceTemplate: class {
    constructor(_template: string, _callbacks: any) {}
  },
}))

const mockCompatibility = jest.fn()
jest.mock('../../mcp/compatibility', () => ({
  checkEmailCompatibility: (html: string, clients: string[]) =>
    mockCompatibility(html, clients),
}))

describe('MCP check_email_compatibility tool', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'postie-mcp-compat-'))
  const store = new FileEmailStore(tempRoot)
  const screenshotService = new ScreenshotService(store)

  beforeEach(() => {
    Object.keys(tools).forEach((key) => {
      delete tools[key]
    })
    mockCompatibility.mockReset()
    mockCompatibility.mockReturnValue({
      success: false,
      errors: [
        {
          reportType: 'errors',
          result: 'Not supported',
          client: 'outlook windows',
        },
      ],
      warnings: [
        {
          reportType: 'warnings',
          result: 'Partially supported',
          client: 'gmail ios',
        },
      ],
      rows: [
        {
          ReportType: 'errors',
          Result: 'Not supported',
          Client: 'outlook windows',
        },
        {
          ReportType: 'warnings',
          Result: 'Partially supported',
          Client: 'gmail ios',
        },
      ],
    })
    createPostieMcpServer(
      store,
      screenshotService,
      '1.0.0',
      () => ['gmail.ios', 'outlook.windows']
    )
  })

  afterAll(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  })

  test('registers compatibility tool as read-only', () => {
    const tool = tools.check_email_compatibility
    expect(tool).toBeDefined()
    expect(tool.config.annotations).toEqual({ readOnlyHint: true })
  })

  test('registers compatibility discovery tool and returns client lists', async () => {
    const tool = tools.list_compatibility_clients
    expect(tool).toBeDefined()
    expect(tool.config.annotations).toEqual({ readOnlyHint: true })

    const result = await tool.handler()
    expect(result.structuredContent.defaultClients).toEqual(
      DEFAULT_COMPATIBILITY_CLIENTS
    )
    expect(result.structuredContent.supportedClients).toEqual(
      SUPPORTED_COMPATIBILITY_CLIENTS
    )
    expect(result.structuredContent.count).toBe(
      SUPPORTED_COMPATIBILITY_CLIENTS.length
    )
  })

  test('registers screenshot discovery tool and returns preset lists', async () => {
    const tool = tools.list_screenshot_presets
    expect(tool).toBeDefined()
    expect(tool.config.annotations).toEqual({ readOnlyHint: true })

    const result = await tool.handler()
    expect(result.structuredContent.defaultPresets).toEqual(
      DEFAULT_SCREENSHOT_PRESETS
    )
    expect(result.structuredContent.supportedPresets).toEqual(
      getSupportedScreenshotPresetIds()
    )
    expect(result.structuredContent.aliases).toEqual(SCREENSHOT_PRESET_ALIASES)
    expect(result.structuredContent.count).toBe(
      getSupportedScreenshotPresetIds().length
    )
  })

  test('uses default compatibility clients when no override is provided', async () => {
    store.storeEmailFile({
      id: 'email-default',
      receivedDateTime: new Date().toISOString(),
      subject: 'HTML email',
      from: 'from@example.com',
      to: 'to@example.com',
      cc: '',
      bcc: '',
      text: 'text',
      html: '<html><body>Hello</body></html>',
      source: 'raw',
      attachments: [],
    })

    const result = await tools.check_email_compatibility.handler({
      emailId: 'email-default',
    })

    expect(mockCompatibility).toHaveBeenCalledWith(
      '<html><body>Hello</body></html>',
      ['gmail.ios', 'outlook.windows']
    )
    expect(result.structuredContent.clientsUsed).toEqual([
      'gmail.ios',
      'outlook.windows',
    ])
    expect(result.structuredContent.errorCount).toBe(1)
    expect(result.structuredContent.warningCount).toBe(1)
  })

  test('uses per-call client override when provided', async () => {
    store.storeEmailFile({
      id: 'email-override',
      receivedDateTime: new Date().toISOString(),
      subject: 'HTML email',
      from: 'from@example.com',
      to: 'to@example.com',
      cc: '',
      bcc: '',
      text: 'text',
      html: '<html><body>Hello</body></html>',
      source: 'raw',
      attachments: [],
    })

    const result = await tools.check_email_compatibility.handler({
      emailId: 'email-override',
      clients: ['apple-mail.ios'],
    })

    expect(mockCompatibility).toHaveBeenCalledWith(
      '<html><body>Hello</body></html>',
      ['apple-mail.ios']
    )
    expect(result.structuredContent.clientsUsed).toEqual(['apple-mail.ios'])
  })

  test('throws with discovery guidance for invalid client override', async () => {
    store.storeEmailFile({
      id: 'email-invalid-client',
      receivedDateTime: new Date().toISOString(),
      subject: 'HTML email',
      from: 'from@example.com',
      to: 'to@example.com',
      cc: '',
      bcc: '',
      text: 'text',
      html: '<html><body>Hello</body></html>',
      source: 'raw',
      attachments: [],
    })

    await expect(
      tools.check_email_compatibility.handler({
        emailId: 'email-invalid-client',
        clients: ['apple.mail.mac'],
      })
    ).rejects.toThrow(
      'Invalid compatibility client(s): apple.mail.mac. Call list_compatibility_clients to get valid IDs.'
    )
  })

  test('throws on unknown email id', async () => {
    await expect(
      tools.check_email_compatibility.handler({ emailId: 'missing-email' })
    ).rejects.toThrow('Email not found: missing-email')
  })

  test('throws when email has no html body', async () => {
    store.storeEmailFile({
      id: 'text-only-email',
      receivedDateTime: new Date().toISOString(),
      subject: 'Text only',
      from: 'from@example.com',
      to: 'to@example.com',
      cc: '',
      bcc: '',
      text: 'text only',
      html: '',
      source: 'raw',
      attachments: [],
    })

    await expect(
      tools.check_email_compatibility.handler({ emailId: 'text-only-email' })
    ).rejects.toThrow('Email text-only-email does not contain HTML content')
  })

  test('capture_email_screenshot accepts canonical preset ids', async () => {
    const captureSpy = jest
      .spyOn(screenshotService, 'captureScreenshot')
      .mockResolvedValue({
        emailId: 'email-shot',
        preset: 'iphone-se',
        width: 375,
        height: 667,
        filePath: '/tmp/email-shot/iphone-se.png',
        resourceUri: 'postie://screenshots/email-shot/iphone-se.png',
        createdAt: new Date().toISOString(),
      })

    const result = await tools.capture_email_screenshot.handler({
      emailId: 'email-shot',
      preset: 'iphone-se',
    })

    expect(captureSpy).toHaveBeenCalledWith('email-shot', 'iphone-se')
    expect(result.structuredContent.screenshot.preset).toBe('iphone-se')
  })

  test('capture_email_screenshot accepts legacy alias presets', async () => {
    const captureSpy = jest
      .spyOn(screenshotService, 'captureScreenshot')
      .mockResolvedValue({
        emailId: 'email-shot',
        preset: 'iphone-14-pro-max',
        width: 430,
        height: 932,
        filePath: '/tmp/email-shot/iphone-14-pro-max.png',
        resourceUri: 'postie://screenshots/email-shot/iphone-14-pro-max.png',
        createdAt: new Date().toISOString(),
      })

    await tools.capture_email_screenshot.handler({
      emailId: 'email-shot',
      preset: 'mobile',
    })

    expect(captureSpy).toHaveBeenCalledWith('email-shot', 'iphone-14-pro-max')
  })

  test('capture_email_screenshot rejects invalid presets with discovery hint', async () => {
    await expect(
      tools.capture_email_screenshot.handler({
        emailId: 'email-shot',
        preset: 'invalid-device',
      })
    ).rejects.toThrow('Call list_screenshot_presets to get valid IDs.')
  })
})
