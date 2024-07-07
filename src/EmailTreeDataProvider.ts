import * as vscode from 'vscode'
import { EmailService } from './EmailService'
import type { EmailTreeItem } from './types/EmailService'
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
      return Promise.resolve(this.emailService.getEmailSummaries())
    }
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire()
  }

  private generateTooltip(element: EmailTreeItem): string {
    const receivedDateTime = formatRelative(
      new Date(element.email.receivedDateTime),
      new Date(),
      { locale: enGB }
    )
    return `From: ${element.email.from}\nTo: ${element.email.to}\nSubject: ${element.email.subject}\nReceived: ${receivedDateTime}`
  }
}
