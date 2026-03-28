import * as vscode from 'vscode'
import type { EmailTreeItem } from './types/EmailService'
import type { EmailService } from './types/EmailService'
import { formatRelative } from 'date-fns/formatRelative'
import { enGB } from 'date-fns/locale'

export class EmailTreeDataProvider
  implements vscode.TreeDataProvider<EmailTreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    EmailTreeItem | undefined | null | void
  > = new vscode.EventEmitter<EmailTreeItem | undefined | null | void>()
  readonly onDidChangeTreeData: vscode.Event<
    EmailTreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event

  constructor(private emailService: EmailService) {
    this.emailService.onEmailsChanged(() => {
      this._onDidChangeTreeData.fire()
    })
  }

  public getTreeItem(element: EmailTreeItem): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.label,
      vscode.TreeItemCollapsibleState.None
    )

    if (element.type === 'server-info') {
      Object.assign(treeItem, {
        contextValue: 'server-info',
        iconPath: new vscode.ThemeIcon('server-environment'),
      })
      return treeItem
    }

    Object.assign(treeItem, {
      contextValue: 'email',
      iconPath: new vscode.ThemeIcon(
        element.email.opened ? 'mail-read' : 'mail'
      ),
      description: element.email.from,
      tooltip: this.generateTooltip(element),
      command: {
        command: 'postie.openEmail',
        title: 'Open Email',
        arguments: [element],
      },
    })
    return treeItem
  }

  public getChildren(element?: EmailTreeItem): Thenable<EmailTreeItem[]> {
    if (element) {
      return Promise.resolve([])
    } else {
      const emailRows = this.emailService.getEmailSummaries().map((item) => ({
        ...item,
        type: 'email' as const,
      }))

      if (emailRows.length > 0) {
        return Promise.resolve(emailRows)
      }

      if (!this.emailService.isRunning) {
        return Promise.resolve([])
      }

      const smtp = this.emailService.getServerConnectionInfo()
      const maskedPassword = this.maskCredential(smtp.password)
      const infoItem: EmailTreeItem = {
        type: 'server-info',
        label: `Server running on ${smtp.host}:${smtp.port}  user=${smtp.username}  pass=${maskedPassword}`,
      } as EmailTreeItem

      return Promise.resolve([infoItem])
    }
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  private generateTooltip(element: EmailTreeItem): string {
    if (element.type !== 'email') {
      return element.label
    }

    const receivedDateTime = formatRelative(
      new Date(element.email.receivedDateTime),
      new Date(),
      { locale: enGB }
    )
    return `From: ${element.email.from}\nTo: ${element.email.to}\nSubject: ${element.email.subject}\nReceived: ${receivedDateTime}`
  }

  private maskCredential(value: string): string {
    if (value.length === 0) {
      return ''
    }

    if (value.length === 1) {
      return '*'
    }

    return `${value[0]}***${value[value.length - 1]}`
  }
}
