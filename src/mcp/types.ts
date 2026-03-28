export type ScreenshotPreset = string

export interface McpEmailSummary {
  id: string
  subject: string
  from: string
  to: string
  receivedDateTime: string
  opened: boolean
  hasHtml: boolean
  attachmentCount: number
}

export interface McpEmailAttachment {
  contentType: string
  fileName: string
  filePath: string | null
  length: number
}

export interface McpEmailDetail extends McpEmailSummary {
  cc: string
  bcc: string
  text: string
  html: string
  source: string
  hasSource: boolean
  attachments: McpEmailAttachment[]
}

export interface EmailScreenshotMetadata {
  emailId: string
  preset: ScreenshotPreset
  width: number
  height: number
  filePath: string
  resourceUri: string
  createdAt: string
}
