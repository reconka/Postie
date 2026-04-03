import React from 'react'
import { createRoot } from 'react-dom/client'
import { z } from 'zod/v4'
import { App } from './App'
import type {
  WebviewCommandMessage,
  WebviewReadyMessage,
} from '../types/WebviewContracts'

declare function acquireVsCodeApi(): {
  postMessage: (message: WebviewReadyMessage | WebviewCommandMessage) => void
}

const container = document.getElementById('root')
if (!container) {
  throw new Error('Postie webview root element not found')
}

const vscode = acquireVsCodeApi()
const root = createRoot(container)

let hasRendered = false
let hasRenderedFallback = false

const initMessageSchema = z.object({
  type: z.literal('init'),
  data: z.object({
    email: z.object({
      id: z.string(),
      subject: z.string(),
      from: z.string(),
      to: z.string(),
      cc: z.string(),
      bcc: z.string(),
      text: z.string(),
      receivedDateTime: z.string(),
    }),
    attachments: z.array(
      z.object({
        id: z.string(),
        fileName: z.string(),
        filePath: z.string().nullable(),
      }),
    ),
    emailDataUrl: z.string(),
    compatibilityRows: z.array(
      z.object({
        ReportType: z.string().optional(),
        Result: z.string().optional(),
        Client: z.string().optional(),
      }),
    ),
    defaultTab: z.string(),
    strings: z.object({
      fromLabel: z.string(),
      subjectLabel: z.string(),
      toLabel: z.string(),
      ccLabel: z.string(),
      bccLabel: z.string(),
      dateLabel: z.string(),
      attachmentsOneLabel: z.string(),
      attachmentsManyLabel: z.string(),
      sourceButtonLabel: z.string(),
      openEmlButtonLabel: z.string(),
      copyIdButtonLabel: z.string(),
      showMoreButtonLabel: z.string(),
      showLessButtonLabel: z.string(),
      tabsAriaLabel: z.string(),
      mobileTabLabel: z.string(),
      tabletTabLabel: z.string(),
      desktopTabLabel: z.string(),
      textOnlyTabLabel: z.string(),
      compatibilityTabLabel: z.string(),
      compatibilityTableAriaLabel: z.string(),
      compatibilityReportTypeHeader: z.string(),
      compatibilityResultHeader: z.string(),
      compatibilityClientHeader: z.string(),
    }),
  }),
})

function isInitEnvelope(value: unknown): value is { type: 'init' } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === 'init'
  )
}

function renderInvalidPayload(message: string, payload: unknown) {
  console.error(message, payload)
  if (hasRenderedFallback || hasRendered) {
    return
  }
  hasRenderedFallback = true
  root.render(
    <div className="postie-view postie-error">
      <h2>Postie couldn't load this email view</h2>
      <p>
        The webview received an invalid payload. Try reopening the email or
        restarting the Postie extension.
      </p>
    </div>,
  )
}

window.addEventListener('message', (event: MessageEvent<unknown>) => {
  const result = initMessageSchema.safeParse(event.data)
  if (!result.success) {
    if (isInitEnvelope(event.data)) {
      renderInvalidPayload('Postie init payload is invalid', event.data)
    }
    return
  }

  if (hasRendered) {
    return
  }

  hasRendered = true
  root.render(<App data={result.data.data} vscode={vscode} />)
})

const readyMessage: WebviewReadyMessage = { type: 'webview-ready' }
vscode.postMessage(readyMessage)
