export interface McpConfigInput {
  mcpServerPath: string
  storagePath: string
  version: string
  compatibilityClients?: string
  screenshotPresets?: string
}

export interface McpConfigOutput {
  config: Record<string, unknown>
  json: string
}

export function buildMcpConfig(input: McpConfigInput): McpConfigOutput {
  const env: Record<string, string> = {
    POSTIE_STORAGE_PATH: input.storagePath,
    POSTIE_VERSION: input.version,
  }

  if (input.compatibilityClients) {
    env.POSTIE_COMPATIBILITY_CLIENTS = input.compatibilityClients
  }

  if (input.screenshotPresets) {
    env.POSTIE_SCREENSHOT_PRESETS = input.screenshotPresets
  }

  const config = {
    mcpServers: {
      postie: {
        command: 'node',
        args: [input.mcpServerPath],
        env,
      },
    },
  }

  return {
    config,
    json: JSON.stringify(config, null, 2),
  }
}
