import * as path from 'path'
import * as vscode from 'vscode'

const MCP_PROVIDER_ID = 'postie.mcp-server'
const MCP_SERVER_LABEL = 'Postie MCP Server'

export function registerMcpServerDefinitionProvider(
  context: vscode.ExtensionContext
) {
  const api = vscode as unknown as {
    lm?: {
      registerMcpServerDefinitionProvider: (
        providerId: string,
        provider: unknown
      ) => vscode.Disposable
    }
    McpStdioServerDefinition?: new (
      label: string,
      command: string,
      args?: string[],
      env?: Record<string, string | number | null>,
      version?: string
    ) => {
      cwd?: vscode.Uri
    }
  }
  const lmApi = api.lm
  const McpStdioServerDefinition = api.McpStdioServerDefinition

  if (
    !lmApi?.registerMcpServerDefinitionProvider ||
    !McpStdioServerDefinition
  ) {
    void vscode.window.showWarningMessage(
      'Postie MCP server is unavailable because this VS Code build does not expose the MCP extension API. Use VS Code 1.102 or newer.'
    )
    return
  }

  const onDidChangeDefinitionsEmitter = new vscode.EventEmitter<void>()
  context.subscriptions.push(onDidChangeDefinitionsEmitter)

  const mcpDefinitionProvider = {
    onDidChangeMcpServerDefinitions: onDidChangeDefinitionsEmitter.event,
    provideMcpServerDefinitions: async () => {
      const mcpEntry = path.join(context.extensionPath, 'out', 'mcpServer.js')
      const definition = new McpStdioServerDefinition(
        MCP_SERVER_LABEL,
        process.execPath,
        [mcpEntry],
        {
          POSTIE_STORAGE_PATH: context.globalStorageUri.fsPath,
          POSTIE_VERSION: context.extension.packageJSON.version,
          POSTIE_COMPATIBILITY_CLIENTS: (
            vscode.workspace
              .getConfiguration('postie')
              .get<string[]>('compatibilityClients') ?? []
          ).join(','),
          POSTIE_SCREENSHOT_PRESETS: (
            vscode.workspace
              .getConfiguration('postie')
              .get<string[]>('screenshotPresets') ?? []
          ).join(','),
        },
        context.extension.packageJSON.version
      )
      definition.cwd = context.extensionUri

      console.log('Postie MCP server definition registered')

      return [definition]
    },
    resolveMcpServerDefinition: async (server: unknown) => server,
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      const affectsCompatibilityClients = event.affectsConfiguration(
        'postie.compatibilityClients'
      )
      const affectsScreenshotPresets = event.affectsConfiguration(
        'postie.screenshotPresets'
      )

      if (affectsCompatibilityClients || affectsScreenshotPresets) {
        onDidChangeDefinitionsEmitter.fire()
      }
    })
  )

  context.subscriptions.push(
    lmApi.registerMcpServerDefinitionProvider(
      MCP_PROVIDER_ID,
      mcpDefinitionProvider
    )
  )
}
