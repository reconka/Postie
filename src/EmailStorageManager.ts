import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode'
import { Email, EmailSummary } from './types/Email'
import { getConfig } from './utilities/getConfig'
import { Attachment } from 'mailparser'

export class EmailStorageManager {
  private storageUri: vscode.Uri
  private emailSummariesPath: string

  constructor(context: vscode.ExtensionContext) {
    this.storageUri = context.globalStorageUri
    this.emailSummariesPath = path.join(
      this.storageUri.fsPath,
      'emailSummaries.json'
    )
    this.initializeStorageIfAbsent()
  }

  public watchEmailSummaries(callback: (emails: EmailSummary[]) => void) {
    fs.watchFile(this.emailSummariesPath, () => {
      callback(this.getEmailSummaries())
    })
  }

  public getEmailSummaries(): EmailSummary[] {
    try {
      if (fs.existsSync(this.emailSummariesPath)) {
        const data = fs.readFileSync(this.emailSummariesPath, {
          encoding: 'utf8',
          flag: 'a+',
        })
        let emails: Array<EmailSummary> = JSON.parse(data)
        return emails
      }
    } catch (error) {
      console.error('Error loading emails from disk:', error)
    }
    return []
  }

  public updateEmailSummaries(emails: EmailSummary[]): void {
    try {
      const data = JSON.stringify(
        emails.slice(0, getConfig('maxStoredEmailsCount'))
      )
      fs.writeFileSync(this.emailSummariesPath, data, 'utf8')
    } catch (error) {
      console.error('Error saving emails to disk:', error)
    }
  }

  public getEmailFile(emailId: string): Email | undefined {
    const emailFilePath = path.join(this.storageUri.fsPath, `${emailId}.json`)
    if (fs.existsSync(emailFilePath)) {
      const data = fs.readFileSync(emailFilePath, 'utf8')
      return JSON.parse(data) as Email
    }
    return undefined
  }

  public storeEmailFile(email: Email) {
    const emailFilePath = path.join(this.storageUri.fsPath, `${email.id}.json`)
    fs.writeFileSync(emailFilePath, JSON.stringify(email), 'utf8')
  }

  public removeEmailFile(emailId: string) {
    const emailFilePath = path.join(this.storageUri.fsPath, `${emailId}.json`)
    const attachmentDirectoryPath = path.join(this.storageUri.fsPath, emailId)
    fs.unlink(emailFilePath, (err) => {
      if (err) {
        console.error('Error deleting email from disk:', err)
      }
    })

    if (fs.existsSync(attachmentDirectoryPath)) {
      fs.rmSync(path.join(attachmentDirectoryPath), {
        recursive: true,
        force: true,
      })
    }
  }

  public clearEmailStorage(): void {
    fs.readdir(this.storageUri.fsPath, (err, files) => {
      if (files.length === 0) {
        return
      }
      if (err) {
        console.error('Error reading email storage directory:', err)
      } else {
        files.forEach((file) => {
          if (!file.includes('.')) {
            fs.rmSync(path.join(this.storageUri.fsPath, file), {
              recursive: true,
            })
            return
          }

          fs.unlink(path.join(this.storageUri.fsPath, file), (err) => {
            if (err) {
              console.error('Error deleting email file:', err)
            }
          })
        })
      }
    })
  }

  public storeAttachments(
    folderName: string,
    attachment: Attachment
  ): vscode.Uri | null {
    const { filename, content } = attachment
    if (!filename) {
      return null
    }
    try {
      const dirPath = path.join(this.storageUri.fsPath, folderName)
      const filePath = path.join(dirPath, filename)

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      fs.writeFileSync(filePath, content)
      return vscode.Uri.file(filePath)
    } catch (error) {
      const errorMessage = (error as Error).message
      vscode.window.showErrorMessage(`Error creating file: ${errorMessage}`)
    }
    return null
  }

  private initializeStorageIfAbsent() {
    if (!fs.existsSync(this.storageUri.fsPath)) {
      fs.mkdirSync(this.storageUri.fsPath, { recursive: true })
    }
  }
}
