export interface AttachmentView {
  id: string
  fileName: string
  filePath: string | null
}

export interface CompatibilityRow {
  ReportType?: string
  Result?: string
  Client?: string
}

export interface WebviewStrings {
  fromLabel: string
  subjectLabel: string
  toLabel: string
  ccLabel: string
  bccLabel: string
  dateLabel: string
  attachmentsOneLabel: string
  attachmentsManyLabel: string
  sourceButtonLabel: string
  openEmlButtonLabel: string
  copyIdButtonLabel: string
  showMoreButtonLabel: string
  showLessButtonLabel: string
  tabsAriaLabel: string
  mobileTabLabel: string
  tabletTabLabel: string
  desktopTabLabel: string
  textOnlyTabLabel: string
  compatibilityTabLabel: string
  compatibilityTableAriaLabel: string
  compatibilityReportTypeHeader: string
  compatibilityResultHeader: string
  compatibilityClientHeader: string
}

export interface AppViewData {
  email: {
    id: string
    subject: string
    from: string
    to: string
    cc: string
    bcc: string
    text: string
    receivedDateTime: string
  }
  attachments: AttachmentView[]
  emailDataUrl: string
  compatibilityRows: CompatibilityRow[]
  defaultTab: string
  strings: WebviewStrings
}

export type WebviewReadyMessage = {
  type: 'webview-ready'
}

export enum WebviewCommand {
  DownloadEml = 'download-eml',
  OpenAttachment = 'open-attachment',
  OpenSource = 'open-source',
  CopyId = 'copy-id',
}

export type DownloadEmlMessage = {
  command: WebviewCommand.DownloadEml
}

export type OpenAttachmentMessage = {
  command: WebviewCommand.OpenAttachment
  fileUrl: string
}

export type OpenSourceMessage = {
  command: WebviewCommand.OpenSource
}

export type CopyIdMessage = {
  command: WebviewCommand.CopyId
}

export type WebviewCommandMessage =
  | DownloadEmlMessage
  | OpenAttachmentMessage
  | OpenSourceMessage
  | CopyIdMessage

export type WebviewToExtensionMessage =
  | WebviewReadyMessage
  | WebviewCommandMessage

export type InitMessage = {
  type: 'init'
  data: AppViewData
}

export type ExtensionToWebviewMessage = InitMessage
