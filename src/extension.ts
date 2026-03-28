import { ExtensionContext, window } from 'vscode'
import { EmailService } from './EmailService'
import { EmailTreeDataProvider } from './EmailTreeDataProvider'
import { registerCommands } from './commands/commands'
import { registerMcpServerDefinitionProvider } from './mcp/registerMcpServerDefinitionProvider'

let emailServiceProvider: EmailTreeDataProvider | null = null

export function activate(context: ExtensionContext): void {
  const emailService = EmailService.getInstance(context)
  emailServiceProvider = new EmailTreeDataProvider(emailService)
  window.registerTreeDataProvider('incomingEmails', emailServiceProvider)
  registerCommands(context, emailService)
  registerMcpServerDefinitionProvider(context)
}

export function deactivate(): void {
  emailServiceProvider?.stopEmailService()
}
