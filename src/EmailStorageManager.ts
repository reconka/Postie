import * as vscode from 'vscode'
import { l10n } from 'vscode'
import { Email, EmailSummary } from './types/Email'
import { getConfig } from './utilities/getConfig'
import { Attachment } from 'mailparser'
import { FileEmailStore } from './mcp/FileEmailStore'

export class EmailStorageManager {
  private readonly storageUri: vscode.Uri
  private readonly fileEmailStore: FileEmailStore

  constructor(context: vscode.ExtensionContext) {
    this.storageUri = context.globalStorageUri
    this.fileEmailStore = new FileEmailStore(this.storageUri.fsPath)
  }

  public watchEmailSummaries(callback: (emails: EmailSummary[]) => void) {
    this.fileEmailStore.watchEmailSummaries(callback)
  }

  public getEmailSummaries(): EmailSummary[] {
    return this.fileEmailStore.getEmailSummaries()
  }

  public updateEmailSummaries(emails: EmailSummary[]): void {
    this.fileEmailStore.updateEmailSummaries(
      emails,
      getConfig('maxStoredEmailsCount')
    )
  }

  public getEmailFile(emailId: string): Email | undefined {
    return this.fileEmailStore.getEmailFile(emailId)
  }

  public storeEmailFile(email: Email) {
    this.fileEmailStore.storeEmailFile(email)
  }

  public removeEmailFile(emailId: string) {
    this.fileEmailStore.removeEmailFile(emailId)
  }

  public clearEmailStorage(): void {
    this.fileEmailStore.clearEmailStorage()
  }

  public storeAttachments(
    folderName: string,
    attachment: Attachment
  ): vscode.Uri | null {
    const filePath = this.fileEmailStore.storeAttachment(folderName, attachment)
    if (!filePath) {
      return null
    }

    try {
      return vscode.Uri.file(filePath)
    } catch (error) {
      const errorMessage = (error as Error).message
      vscode.window.showErrorMessage(
        l10n.t('Error creating file: {0}', errorMessage)
      )
    }
    return null
  }
}
