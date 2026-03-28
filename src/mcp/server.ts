import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { FileEmailStore } from './FileEmailStore'
import { createPostieMcpServer } from './createMcpServer'
import { ScreenshotService } from './ScreenshotService'
import { readCompatibilityClientsFromEnv } from './compatibilityClients'
import { readScreenshotPresetsFromEnv } from './screenshotPresets'

async function main() {
  const storagePath = process.env.POSTIE_STORAGE_PATH
  const version = process.env.POSTIE_VERSION || '1.0.0'

  if (!storagePath) {
    throw new Error('POSTIE_STORAGE_PATH is required')
  }

  const store = new FileEmailStore(storagePath)
  const screenshotService = new ScreenshotService(store)
  const server = createPostieMcpServer(
    store,
    screenshotService,
    version,
    () => readCompatibilityClientsFromEnv(process.env.POSTIE_COMPATIBILITY_CLIENTS),
    () => readScreenshotPresetsFromEnv(process.env.POSTIE_SCREENSHOT_PRESETS)
  )
  const transport = new StdioServerTransport()

  await server.connect(transport)
}

main().catch((error) => {
  console.error('Postie MCP server failed to start:', error)
  process.exit(1)
})
