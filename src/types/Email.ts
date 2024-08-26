export interface Email {
  id: string
  receivedDateTime: string
  subject: string
  from: string
  to: string
  cc: string
  bcc: string
  text: string
  html: string
  source: string
  attachments: Attachment[]
}

export interface EmailSummary {
  id: string
  subject: string
  from: string
  to: string
  opened: boolean
  receivedDateTime: Date
}

export interface Attachment {
  contentType: string
  fileName: string
  contentDisposition: string
  generatedFileName: string
  contentId: string
  length: number
}

export interface CompatibilityResult {
  ReportType: string
  Result: string
  Client: string
}
