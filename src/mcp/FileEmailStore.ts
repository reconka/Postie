import * as fs from 'fs'
import * as path from 'path'
import { Attachment } from 'mailparser'
import { Email, EmailSummary } from '../types/Email'
import { ScreenshotPreset } from './types'

interface ScreenshotFileRecord {
  emailId: string
  preset: ScreenshotPreset
  filePath: string
}

export class FileEmailStore {
  private readonly emailSummariesPath: string
  private readonly screenshotsPath: string

  constructor(private readonly storagePath: string) {
    this.emailSummariesPath = path.join(this.storagePath, 'emailSummaries.json')
    this.screenshotsPath = path.join(this.storagePath, 'screenshots')
    this.initializeStorageIfAbsent()
  }

  public getStoragePath(): string {
    return this.storagePath
  }

  public watchEmailSummaries(callback: (emails: EmailSummary[]) => void) {
    fs.watchFile(this.emailSummariesPath, () => {
      callback(this.getEmailSummaries())
    })
  }

  public getEmailSummaries(): EmailSummary[] {
    try {
      if (!fs.existsSync(this.emailSummariesPath)) {
        return []
      }

      const data = fs.readFileSync(this.emailSummariesPath, {
        encoding: 'utf8',
        flag: 'a+',
      })
      if (data.trim().length === 0) {
        return []
      }
      const emails = JSON.parse(data) as EmailSummary[]
      return emails
    } catch (error) {
      console.error('Error loading emails from disk:', error)
      return []
    }
  }

  public updateEmailSummaries(emails: EmailSummary[], maxStoredEmailsCount: number) {
    try {
      const data = JSON.stringify(emails.slice(0, maxStoredEmailsCount))
      fs.writeFileSync(this.emailSummariesPath, data, 'utf8')
    } catch (error) {
      console.error('Error saving emails to disk:', error)
    }
  }

  public getEmailFile(emailId: string): Email | undefined {
    const emailFilePath = path.join(this.storagePath, `${emailId}.json`)
    if (!fs.existsSync(emailFilePath)) {
      return undefined
    }

    const data = fs.readFileSync(emailFilePath, 'utf8')
    return JSON.parse(data) as Email
  }

  public storeEmailFile(email: Email) {
    const emailFilePath = path.join(this.storagePath, `${email.id}.json`)
    fs.writeFileSync(emailFilePath, JSON.stringify(email), 'utf8')
  }

  public removeEmailFile(emailId: string) {
    const emailFilePath = path.join(this.storagePath, `${emailId}.json`)
    const attachmentDirectoryPath = path.join(this.storagePath, emailId)
    const screenshotDirectoryPath = path.join(this.screenshotsPath, emailId)

    fs.unlink(emailFilePath, (err) => {
      if (err) {
        console.error('Error deleting email from disk:', err)
      }
    })

    if (fs.existsSync(attachmentDirectoryPath)) {
      fs.rmSync(attachmentDirectoryPath, {
        recursive: true,
        force: true,
      })
    }

    if (fs.existsSync(screenshotDirectoryPath)) {
      fs.rmSync(screenshotDirectoryPath, {
        recursive: true,
        force: true,
      })
    }
  }

  public clearEmailStorage() {
    fs.readdir(this.storagePath, (err, files) => {
      if (err) {
        console.error('Error reading email storage directory:', err)
        return
      }

      files.forEach((file) => {
        const filePath = path.join(this.storagePath, file)

        if (file === 'screenshots') {
          fs.rmSync(filePath, {
            recursive: true,
            force: true,
          })
          return
        }

        if (!file.includes('.')) {
          fs.rmSync(filePath, {
            recursive: true,
            force: true,
          })
          return
        }

        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error deleting email file:', unlinkErr)
          }
        })
      })
    })
  }

  public storeAttachment(folderName: string, attachment: Attachment): string | null {
    const { filename, content } = attachment
    if (!filename) {
      return null
    }

    try {
      const dirPath = path.join(this.storagePath, folderName)
      const filePath = path.join(dirPath, filename)

      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      fs.writeFileSync(filePath, content)
      return filePath
    } catch (error) {
      console.error('Error creating attachment file:', error)
      return null
    }
  }

  public getScreenshotFilePath(emailId: string, preset: ScreenshotPreset): string {
    const screenshotDirectory = path.join(this.screenshotsPath, emailId)
    return path.join(screenshotDirectory, `${preset}.png`)
  }

  public getScreenshotWriteFilePath(
    emailId: string,
    preset: ScreenshotPreset
  ): string {
    const screenshotDirectory = path.join(this.screenshotsPath, emailId)
    if (!fs.existsSync(screenshotDirectory)) {
      fs.mkdirSync(screenshotDirectory, { recursive: true })
    }

    return this.getScreenshotFilePath(emailId, preset)
  }

  public listScreenshotFiles(): ScreenshotFileRecord[] {
    if (!fs.existsSync(this.screenshotsPath)) {
      return []
    }

    return fs
      .readdirSync(this.screenshotsPath, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .flatMap((entry) => {
        const emailId = entry.name
        const screenshotDirectory = path.join(this.screenshotsPath, emailId)

        return fs
          .readdirSync(screenshotDirectory, { withFileTypes: true })
          .filter((child) => child.isFile() && child.name.endsWith('.png'))
          .map((child) => ({
            emailId,
            preset: child.name.replace(/\.png$/, '') as ScreenshotPreset,
            filePath: path.join(screenshotDirectory, child.name),
          }))
      })
  }

  public readScreenshotFile(emailId: string, preset: ScreenshotPreset): Buffer {
    return fs.readFileSync(this.getScreenshotFilePath(emailId, preset))
  }

  public screenshotExists(emailId: string, preset: ScreenshotPreset): boolean {
    return fs.existsSync(this.getScreenshotFilePath(emailId, preset))
  }

  private initializeStorageIfAbsent() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true })
    }
  }
}
