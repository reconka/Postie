import { EmailSummary, Email } from './Email'
import { Event, TreeItem } from 'vscode'

export interface EmailService {
  isRunning: boolean
  deleteEmailSummaries(): void
  deleteEmailDetails(emailId: string): void
  stopServer(): Promise<void>
  startServer(): void
  getEmailSummaries(): { label: string; email: EmailSummary }[]
  markEmailAsRead(emailId: string): void
  getEmailDetails(emailId: string): Promise<Email>
}

export interface EmailTreeItem extends TreeItem {
  label: string
  email: EmailSummary
}
