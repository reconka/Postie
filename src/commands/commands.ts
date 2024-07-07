import { ExtensionContext, window, commands } from 'vscode'
import { EmailView } from '../panels/EmailView'
import { EmailService } from '../types/EmailService'

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
            window.showErrorMessage(`Error executing ${name}: ${error}`)
          }
        }
      : (...args: any[]) => {
          try {
            callback(...args)
          } catch (error) {
            window.showErrorMessage(`Error executing ${name}: ${error}`)
          }
        }

    context.subscriptions.push(commands.registerCommand(name, command))
  }

  registerCommand('postie.deleteEmailDetails', (): void => {
    emailService.deleteEmailSummaries()
    window.showInformationMessage('Emails deleted!')
  })

  registerCommand(
    'postie.deleteSelectedEmail',
    (node: { email: { id: string } }) => {
      try {
        emailService.deleteEmailDetails(node.email.id)
      } catch (error) {
        window.showErrorMessage(`Error deleting email: ${error}`)
      }
    }
  )

  registerCommand('postie.stopServer', (): void => {
    emailService.stopServer()
    window.showInformationMessage('Postie Email Server stopped!')
  })

  registerCommand(
    'postie.restartServer',
    () => {
      emailService.stopServer()
      emailService.startServer()

      window.showInformationMessage('Postie Email Server restarted!')
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
}
