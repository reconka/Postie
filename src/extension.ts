import { ExtensionContext, window } from 'vscode'
import { EmailService } from './EmailService'
import { EmailTreeDataProvider } from './EmailTreeDataProvider'
import { registerCommands } from './commands/commands'

export function activate(context: ExtensionContext): void {
  const emailService = EmailService.getInstance(context)
  const emailServiceProvider = new EmailTreeDataProvider(emailService)
  window.registerTreeDataProvider('incomingEmails', emailServiceProvider)
  registerCommands(context, emailService)
}

export function deactivate(this: any): void {
  this.emailServiceProvider.emailService.stopServer()
}
