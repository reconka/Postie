import { EmailSummary, Email } from './Email'
import { Event, TreeItem } from 'vscode'
import type { ServerConnectionInfo } from '../EmailService'

export interface EmailService {
  isRunning: boolean
  onEmailsChanged: Event<void>
  deleteEmailSummaries(): void
  deleteEmailDetails(emailId: string): void
  stopServer(): Promise<void>
  startServer(): void
  getEmailSummaries(): { label: string; email: EmailSummary }[]
  markEmailAsRead(emailId: string): void
  getEmailDetails(emailId: string): Promise<Email>
  getServerConnectionInfo(): ServerConnectionInfo
}

export interface EmailRowTreeItem extends TreeItem {
  label: string
  email: EmailSummary
  type: 'email'
}

export interface ServerInfoTreeItem extends TreeItem {
  label: string
  type: 'server-info'
}

export type EmailTreeItem = EmailRowTreeItem | ServerInfoTreeItem
