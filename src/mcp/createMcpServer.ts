import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod/v4'
import { version as packageVersion } from '../../package.json'
import { FileEmailStore } from './FileEmailStore'
import { mergeSummaryWithEmail, mapEmailDetailToMcp } from './mappers'
import {
  buildScreenshotResourceUri,
  parseScreenshotResourceUri,
  ScreenshotService,
} from './ScreenshotService'
import { ScreenshotPreset } from './types'
import { checkEmailCompatibility } from './compatibility'
import {
  DEFAULT_COMPATIBILITY_CLIENTS,
  SUPPORTED_COMPATIBILITY_CLIENTS,
  getInvalidCompatibilityClients,
  normalizeCompatibilityClients,
} from '../compatibility/clientsConfig'
import {
  DEFAULT_SCREENSHOT_PRESETS,
  getSupportedScreenshotPresetIds,
  resolveScreenshotPreset,
  SCREENSHOT_PRESET_ALIASES,
} from '../screenshot/presetsConfig'

const screenshotPresetSchema = z.string().min(1).optional()

function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

export function createPostieMcpServer(
  store: FileEmailStore,
  screenshotService: ScreenshotService,
  version: string = packageVersion,
  getCompatibilityClients: () => string[] = () => DEFAULT_COMPATIBILITY_CLIENTS,
  getScreenshotPresets: () => string[] = () => DEFAULT_SCREENSHOT_PRESETS
) {
  const server = new McpServer({
    name: 'postie',
    version,
  })

  server.registerTool(
    'list_emails',
    {
      title: 'List Emails',
      description: 'List stored emails from the Postie inbox.',
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional(),
      },
      outputSchema: {
        emails: z.array(
          z.object({
            id: z.string(),
            subject: z.string(),
            from: z.string(),
            to: z.string(),
            receivedDateTime: z.string(),
            opened: z.boolean(),
            hasHtml: z.boolean(),
            attachmentCount: z.number().int(),
          })
        ),
      },
    },
    async ({ limit = 20 }) => {
      const emails = store
        .getEmailSummaries()
        .slice(0, limit)
        .map((summary) =>
          mergeSummaryWithEmail(summary, store.getEmailFile(summary.id))
        )

      return {
        content: [
          {
            type: 'text' as const,
            text: formatJson({ emails }),
          },
        ],
        structuredContent: {
          emails,
        },
      }
    }
  )

  server.registerTool(
    'get_email',
    {
      title: 'Get Email',
      description: 'Get the full stored email details for a Postie email id.',
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        emailId: z.string().min(1),
      },
      outputSchema: {
        email: z.object({
          id: z.string(),
          subject: z.string(),
          from: z.string(),
          to: z.string(),
          cc: z.string(),
          bcc: z.string(),
          text: z.string(),
          html: z.string(),
          source: z.string(),
          hasSource: z.boolean(),
          receivedDateTime: z.string(),
          opened: z.boolean(),
          hasHtml: z.boolean(),
          attachmentCount: z.number().int(),
          attachments: z.array(
            z.object({
              contentType: z.string(),
              fileName: z.string(),
              filePath: z.string().nullable(),
              length: z.number().int(),
            })
          ),
        }),
      },
    },
    async ({ emailId }) => {
      const summary = store
        .getEmailSummaries()
        .find((email) => email.id === emailId)
      const email = store.getEmailFile(emailId)
      if (!summary || !email) {
        throw new Error(`Email not found: ${emailId}`)
      }

      const detail = mapEmailDetailToMcp(email, summary.opened)

      return {
        content: [
          {
            type: 'text' as const,
            text: formatJson({ email: detail }),
          },
        ],
        structuredContent: {
          email: detail,
        },
      }
    }
  )

  server.registerTool(
    'list_screenshot_presets',
    {
      title: 'List Screenshot Presets',
      description:
        'List supported screenshot preset IDs and backward-compatible aliases for capture_email_screenshot.',
      annotations: {
        readOnlyHint: true,
      },
      outputSchema: {
        defaultPresets: z.array(z.string()),
        supportedPresets: z.array(z.string()),
        aliases: z.record(z.string(), z.string()),
        count: z.number().int(),
      },
    },
    async () => {
      const output = {
        defaultPresets: getScreenshotPresets(),
        supportedPresets: getSupportedScreenshotPresetIds(),
        aliases: SCREENSHOT_PRESET_ALIASES,
        count: getSupportedScreenshotPresetIds().length,
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: formatJson(output),
          },
        ],
        structuredContent: output,
      }
    }
  )

  server.registerTool(
    'list_compatibility_clients',
    {
      title: 'List Compatibility Clients',
      description:
        'List valid compatibility client IDs for check_email_compatibility.',
      annotations: {
        readOnlyHint: true,
      },
      outputSchema: {
        defaultClients: z.array(z.string()),
        supportedClients: z.array(z.string()),
        count: z.number().int(),
      },
    },
    async () => {
      const output = {
        defaultClients: DEFAULT_COMPATIBILITY_CLIENTS,
        supportedClients: SUPPORTED_COMPATIBILITY_CLIENTS,
        count: SUPPORTED_COMPATIBILITY_CLIENTS.length,
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: formatJson(output),
          },
        ],
        structuredContent: output,
      }
    }
  )

  server.registerTool(
    'check_email_compatibility',
    {
      title: 'Check Email Compatibility',
      description:
        'Check compatibility problems for a stored HTML email and return structured issues by email client.',
      annotations: {
        readOnlyHint: true,
      },
      inputSchema: {
        emailId: z.string().min(1),
        clients: z.array(z.string().min(1)).optional(),
      },
      outputSchema: {
        emailId: z.string(),
        clientsUsed: z.array(z.string()),
        success: z.boolean(),
        errorCount: z.number().int(),
        warningCount: z.number().int(),
        errors: z.array(
          z.object({
            reportType: z.string(),
            result: z.string(),
            client: z.string(),
          })
        ),
        warnings: z.array(
          z.object({
            reportType: z.string(),
            result: z.string(),
            client: z.string(),
          })
        ),
        rows: z.array(
          z.object({
            ReportType: z.string(),
            Result: z.string(),
            Client: z.string().optional(),
          })
        ),
      },
    },
    async ({ emailId, clients }) => {
      const email = store.getEmailFile(emailId)
      if (!email) {
        throw new Error(`Email not found: ${emailId}`)
      }

      if (!email.html || email.html.trim().length === 0) {
        throw new Error(`Email ${emailId} does not contain HTML content`)
      }

      const clientsUsed =
        clients && clients.length > 0
          ? normalizeCompatibilityClients(clients)
          : normalizeCompatibilityClients(getCompatibilityClients())
      const invalidClients = getInvalidCompatibilityClients(clientsUsed)
      if (invalidClients.length > 0) {
        throw new Error(
          `Invalid compatibility client(s): ${invalidClients.join(
            ', '
          )}. Call list_compatibility_clients to get valid IDs.`
        )
      }

      const result = checkEmailCompatibility(email.html, clientsUsed)
      const output = {
        emailId,
        clientsUsed,
        success: result.success,
        errorCount: result.errors.length,
        warningCount: result.warnings.length,
        errors: result.errors,
        warnings: result.warnings,
        rows: result.rows,
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: formatJson(output),
          },
        ],
        structuredContent: output,
      }
    }
  )

  server.registerTool(
    'capture_email_screenshot',
    {
      title: 'Capture Email Screenshot',
      description:
        'Capture a PNG screenshot for a stored HTML email using a named viewport preset.',
      inputSchema: {
        emailId: z.string().min(1),
        preset: screenshotPresetSchema,
      },
      outputSchema: {
        screenshot: z.object({
          emailId: z.string(),
          preset: z.string(),
          width: z.number().int(),
          height: z.number().int(),
          filePath: z.string(),
          resourceUri: z.string(),
          createdAt: z.string(),
        }),
      },
    },
    async ({ emailId, preset }) => {
      const defaultPreset = getScreenshotPresets()[0]
      const requestedPreset = preset ?? defaultPreset
      if (!requestedPreset) {
        throw new Error(
          'No screenshot preset configured. Call list_screenshot_presets to get valid IDs.'
        )
      }

      const resolvedPreset = resolveScreenshotPreset(requestedPreset)
      if (!resolvedPreset) {
        throw new Error(
          `Unsupported screenshot preset: ${requestedPreset}. Valid preset IDs: ${getSupportedScreenshotPresetIds().join(
            ', '
          )}. Aliases: ${Object.keys(SCREENSHOT_PRESET_ALIASES).join(
            ', '
          )}. Call list_screenshot_presets to get valid IDs.`
        )
      }

      const screenshot = await screenshotService.captureScreenshot(
        emailId,
        resolvedPreset.id as ScreenshotPreset
      )

      return {
        content: [
          {
            type: 'text' as const,
            text: formatJson({ screenshot }),
          },
          {
            type: 'resource_link' as const,
            uri: screenshot.resourceUri,
            name: `Postie Screenshot ${emailId} (${screenshot.preset})`,
            mimeType: 'image/png',
            description:
              'Generated screenshot resource for a Postie email preview.',
          },
        ],
        structuredContent: {
          screenshot,
        },
      }
    }
  )

  server.registerResource(
    'email-screenshot',
    new ResourceTemplate('postie://screenshots/{emailId}/{preset}.png', {
      list: async () => ({
        resources: store.listScreenshotFiles().map((screenshot) => ({
          uri: buildScreenshotResourceUri(
            screenshot.emailId,
            screenshot.preset
          ),
          name: `Postie Screenshot ${screenshot.emailId} (${screenshot.preset})`,
          mimeType: 'image/png',
          description:
            'Generated screenshot resource for a Postie email preview.',
        })),
      }),
    }),
    {
      title: 'Postie Email Screenshot',
      mimeType: 'image/png',
      description: 'Browse generated email screenshot captures.',
    },
    async (uri) => {
      const parsed = parseScreenshotResourceUri(uri.toString())
      const file = store.readScreenshotFile(parsed.emailId, parsed.preset)

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: 'image/png',
            blob: file.toString('base64'),
          },
        ],
      }
    }
  )

  return server
}
