import {
  ExtensionContext,
  window,
  commands,
  workspace,
  ConfigurationTarget,
  l10n,
} from 'vscode'
import * as fs from 'fs'
import { EmailView } from '../panels/EmailView'
import { EmailService } from '../types/EmailService'
import { buildMcpConfig } from '../mcp/cliConfig'
import { listPostieStorageCandidates } from '../mcp/storageDiscovery'
import {
  getDefaultCursorConfigPaths,
  writeCursorMcpConfigs,
} from '../mcp/cursorConfigWriter'
import {
  getDefaultCodexConfigPaths,
  writeCodexConfigs,
} from '../mcp/codexConfigWriter'
import {
  getDefaultClaudeConfigPaths,
  writeClaudeConfigs,
} from '../mcp/claudeConfigWriter'
import {
  StorageSelectionError,
  choosePostieStoragePath,
} from '../mcp/storageSelection'
import {
  getCommandExecutionFailedMessage,
  getMcpSetupCancelledMessage,
  getMcpSetupFailedMessage,
} from '../utilities/messages'

export function registerCommands(
  context: ExtensionContext,
  emailService: EmailService
) {
  const registerCommand = (
    name: string,
    callback: (...args: any[]) => void,
    isAsync = false
  ) => {
    const command = isAsync
      ? async (...args: any[]) => {
          try {
            await callback(...args)
          } catch (error) {
            window.showErrorMessage(getCommandExecutionFailedMessage(name, error))
          }
        }
      : (...args: any[]) => {
          try {
            callback(...args)
          } catch (error) {
            window.showErrorMessage(getCommandExecutionFailedMessage(name, error))
          }
        }

    context.subscriptions.push(commands.registerCommand(name, command))
  }

  registerCommand('postie.deleteEmailDetails', (): void => {
    emailService.deleteEmailSummaries()
    window.showInformationMessage(l10n.t('Emails deleted!'))
  })

  registerCommand(
    'postie.deleteSelectedEmail',
    (node: { email: { id: string } }) => {
      try {
        emailService.deleteEmailDetails(node.email.id)
      } catch (error) {
        window.showErrorMessage(l10n.t('Error deleting email: {0}', String(error)))
      }
    }
  )

  registerCommand('postie.stopServer', async (): Promise<void> => {
    await emailService.stopServer()
    window.showInformationMessage(l10n.t('Postie Email Server stopped!'))
  }, true)

  registerCommand(
    'postie.restartServer',
    async () => {
      await emailService.stopServer()
      emailService.startServer()

      window.showInformationMessage(l10n.t('Postie Email Server restarted!'))
    },
    true
  )

  registerCommand(
    'postie.openEmail',
    async (emailObject: { email: { id: string } }) => {
      const emailDetails = await emailService.getEmailDetails(
        emailObject.email.id
      )
      emailService.markEmailAsRead(emailObject.email.id)

      EmailView.render(context.extensionUri, emailDetails)
    },
    true
  )

  registerCommand(
    'postie.setupMcpForEditors',
    async () => {
      try {
        const storagePath = await resolveMcpStoragePath()

        const mcpServerPath = context.asAbsolutePath('out/mcpServer.js')
        const version = context.extension.packageJSON.version ?? '1.0.0'
        const { compatibilityClients, screenshotPresets } =
          readMcpOptionalSettings()

        const { config: mcpConfig } = buildMcpConfig({
          mcpServerPath,
          storagePath,
          version,
          compatibilityClients: compatibilityClients || undefined,
          screenshotPresets: screenshotPresets || undefined,
        })

        const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath
        const paths = getDefaultCursorConfigPaths(workspaceRoot)
        const postieEntry = getPostieEntry(mcpConfig)
        const written = writeCursorMcpConfigs({
          paths,
          postieEntry,
        })

        const message = l10n.t(
          'Postie MCP config updated in: {0}',
          written.join(', ')
        )
        window.showInformationMessage(message)
      } catch (error) {
        if (error instanceof StorageSelectionError) {
          if (error.code === 'CANCELLED') {
            window.showInformationMessage(getMcpSetupCancelledMessage())
            return
          }
        }

        window.showErrorMessage(getMcpSetupFailedMessage(error))
      }
    },
    true
  )

  registerCommand(
    'postie.setupMcpForCodex',
    async () => {
      try {
        const storagePath = await resolveMcpStoragePath()
        const mcpServerPath = context.asAbsolutePath('out/mcpServer.js')
        const version = context.extension.packageJSON.version ?? '1.0.0'
        const { compatibilityClients, screenshotPresets } =
          readMcpOptionalSettings()

        const { config: mcpConfig } = buildMcpConfig({
          mcpServerPath,
          storagePath,
          version,
          compatibilityClients: compatibilityClients || undefined,
          screenshotPresets: screenshotPresets || undefined,
        })

        const postieEntry = getPostieEntry(mcpConfig)

        const codexPostieConfig = {
          command: postieEntry.command ?? 'node',
          args: postieEntry.args ?? [mcpServerPath],
          env: postieEntry.env ?? {},
        }

        const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath
        const paths = getDefaultCodexConfigPaths(workspaceRoot)
        const written = writeCodexConfigs({
          paths,
          postieConfig: codexPostieConfig,
        })

        window.showInformationMessage(
          l10n.t(
            'Postie MCP config updated for Codex in: {0}',
            written.join(', ')
          )
        )
      } catch (error) {
        handleMcpSetupError(error)
      }
    },
    true
  )

  registerCommand(
    'postie.setupMcpForClaudeCode',
    async () => {
      try {
        const storagePath = await resolveMcpStoragePath()
        const mcpServerPath = context.asAbsolutePath('out/mcpServer.js')
        const version = context.extension.packageJSON.version ?? '1.0.0'
        const { compatibilityClients, screenshotPresets } =
          readMcpOptionalSettings()

        const { config: mcpConfig } = buildMcpConfig({
          mcpServerPath,
          storagePath,
          version,
          compatibilityClients: compatibilityClients || undefined,
          screenshotPresets: screenshotPresets || undefined,
        })

        const postieEntry = getPostieEntry(mcpConfig)

        const claudePostieConfig = {
          type: 'stdio' as const,
          command: postieEntry.command ?? 'node',
          args: postieEntry.args ?? [mcpServerPath],
          env: postieEntry.env ?? {},
        }

        const workspaceRoot = workspace.workspaceFolders?.[0]?.uri.fsPath
        const paths = getDefaultClaudeConfigPaths(workspaceRoot)
        const written = writeClaudeConfigs({
          paths,
          postieConfig: claudePostieConfig,
        })

        window.showInformationMessage(
          l10n.t(
            'Postie MCP config updated for Claude Code in: {0}',
            written.join(', ')
          )
        )
      } catch (error) {
        handleMcpSetupError(error)
      }
    },
    true
  )
}

type PostieMcpEntry = Record<string, unknown> & {
  command?: string
  args?: string[]
  env?: Record<string, string>
}

type McpConfigWithServers = {
  mcpServers?: {
    postie?: PostieMcpEntry
  }
}

function getPostieEntry(config: Record<string, unknown>): PostieMcpEntry {
  return (config as McpConfigWithServers).mcpServers?.postie ?? {}
}

async function resolveMcpStoragePath(): Promise<string> {
  const config = workspace.getConfiguration('postie')
  const savedPathRaw = config.get<string>('mcpStoragePath') ?? ''
  const savedPath =
    savedPathRaw.trim().length > 0 ? savedPathRaw.trim() : undefined
  const savedPathExists = savedPath ? fs.existsSync(savedPath) : false
  if (savedPath && !savedPathExists) {
    window.showWarningMessage(
      l10n.t(
        'Saved MCP storage path does not exist: {0}. Please select a new one.',
        savedPath
      )
    )
  }

  const candidates = listPostieStorageCandidates()
  const storagePath = await choosePostieStoragePath({
    savedPath: savedPathExists ? savedPath : undefined,
    candidates,
    select: async (paths) => {
      const items = buildStorageQuickPickItems(paths)
      const choice = await window.showQuickPick(items, {
        placeHolder: l10n.t('Select the Postie storage folder to use for MCP'),
      })
      return choice?.path
    },
  })

  if (storagePath && storagePath !== savedPath) {
    await config.update(
      'mcpStoragePath',
      storagePath,
      ConfigurationTarget.Global
    )
  }

  return storagePath
}

function readMcpOptionalSettings(): {
  compatibilityClients: string
  screenshotPresets: string
} {
  const compatibilityClients = (
    workspace
      .getConfiguration('postie')
      .get<string[]>('compatibilityClients') ?? []
  ).join(',')
  const screenshotPresets = (
    workspace
      .getConfiguration('postie')
      .get<string[]>('screenshotPresets') ?? []
  ).join(',')

  return { compatibilityClients, screenshotPresets }
}

function handleMcpSetupError(error: unknown) {
  if (error instanceof StorageSelectionError) {
    if (error.code === 'CANCELLED') {
      window.showInformationMessage(getMcpSetupCancelledMessage())
      return
    }
  }

  window.showErrorMessage(getMcpSetupFailedMessage(error))
}

function buildStorageQuickPickItems(
  paths: string[]
): Array<{ label: string; description: string; path: string }> {
  const labels = paths.map((storagePath) => ({
    path: storagePath,
    label: getStorageLabel(storagePath),
  }))

  const counts = labels.reduce<Record<string, number>>((acc, item) => {
    acc[item.label] = (acc[item.label] ?? 0) + 1
    return acc
  }, {})

  return labels.map((item) => ({
    label:
      counts[item.label] > 1
        ? l10n.t('{0} ({1})', item.label, item.path)
        : item.label,
    description: item.path,
    path: item.path,
  }))
}

function getStorageLabel(storagePath: string): string {
  const normalized = storagePath.replace(/\\/g, '/')
  if (normalized.includes('/Cursor - Insiders/')) {
    return l10n.t('Cursor Insiders')
  }
  if (normalized.includes('/Cursor/')) {
    return l10n.t('Cursor')
  }
  if (normalized.includes('/Code - Insiders/')) {
    return l10n.t('VS Code Insiders')
  }
  if (normalized.includes('/Code/')) {
    return l10n.t('VS Code')
  }
  if (normalized.includes('/VSCodium/')) {
    return l10n.t('VSCodium')
  }
  return l10n.t('Postie storage')
}
