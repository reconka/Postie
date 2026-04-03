import { l10n } from 'vscode'

export function getCommandExecutionFailedMessage(
  commandName: string,
  error: unknown
): string {
  return l10n.t(
    {
      message: 'Error executing {0}: {1}',
      comment: ['Shown when running a VS Code command fails.'],
      args: [commandName, String(error)],
    }
  )
}

export function getMcpSetupCancelledMessage(): string {
  return l10n.t(
    {
      message: 'Postie MCP setup cancelled. No changes were made.',
      comment: ['Shown when a user cancels MCP setup.'],
      args: [],
    }
  )
}

export function getMcpSetupFailedMessage(error: unknown): string {
  return l10n.t(
    {
      message: 'Failed to set up MCP config: {0}',
      comment: ['Shown when MCP setup fails with an error.'],
      args: [error instanceof Error ? error.message : String(error)],
    }
  )
}
