import { Email, EmailSummary } from '../types/Email'
import {
  McpEmailAttachment,
  McpEmailDetail,
  McpEmailSummary,
} from './types'

function getAttachmentFilePath(fileUrl: unknown): string | null {
  if (!fileUrl || typeof fileUrl !== 'object') {
    return null
  }

  const maybeUri = fileUrl as { fsPath?: string; path?: string }
  return maybeUri.fsPath || maybeUri.path || null
}

export function mapEmailSummaryToMcp(summary: EmailSummary): McpEmailSummary {
  return {
    id: summary.id,
    subject: summary.subject,
    from: summary.from,
    to: summary.to,
    receivedDateTime: new Date(summary.receivedDateTime).toISOString(),
    opened: summary.opened,
    hasHtml: false,
    attachmentCount: 0,
  }
}

export function mapEmailDetailToMcp(email: Email, opened = false): McpEmailDetail {
  const attachments: McpEmailAttachment[] = email.attachments.map((attachment) => ({
    contentType: attachment.contentType,
    fileName: attachment.fileName,
    filePath: getAttachmentFilePath(attachment.fileUrl),
    length: attachment.length,
  }))

  return {
    id: email.id,
    subject: email.subject,
    from: email.from,
    to: email.to,
    cc: email.cc,
    bcc: email.bcc,
    text: email.text,
    html: email.html,
    source: email.source,
    hasSource: email.source.trim().length > 0,
    receivedDateTime: new Date(email.receivedDateTime).toISOString(),
    opened,
    hasHtml: email.html.trim().length > 0,
    attachmentCount: attachments.length,
    attachments,
  }
}

export function mergeSummaryWithEmail(
  summary: EmailSummary,
  email: Email | undefined
): McpEmailSummary {
  if (!email) {
    return mapEmailSummaryToMcp(summary)
  }

  const detail = mapEmailDetailToMcp(email, summary.opened)
  return {
    id: detail.id,
    subject: detail.subject,
    from: detail.from,
    to: detail.to,
    receivedDateTime: detail.receivedDateTime,
    opened: detail.opened,
    hasHtml: detail.hasHtml,
    attachmentCount: detail.attachmentCount,
  }
}
