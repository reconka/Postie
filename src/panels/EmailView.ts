import {
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ViewColumn,
  env,
} from 'vscode'
import { getUri } from '../utilities/getUri'
import { Email } from '../types/Email'
import { openInNewEditor } from './utilities/openInNewEditor'
import { getConfig } from '../utilities/getConfig'
import { formatStringToBase64DataUrl } from '../utilities/formatters'
import { EmailCompatibilityService } from '../EmailCompatibilityService'
import type {
  AppViewData,
  ExtensionToWebviewMessage,
  WebviewReadyMessage,
  WebviewCommandMessage,
} from '../types/WebviewContracts'
import { WebviewCommand } from '../types/WebviewContracts'

export class EmailView {
  public static panels: Map<string, EmailView> = new Map()
  private readonly _panel: WebviewPanel
  private _disposables: Disposable[] = []
  private email!: Email

  private constructor(panel: WebviewPanel, extensionUri: Uri, email: Email) {
    this._panel = panel
    this.email = email
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri,
    )

    this._setWebviewMessageListener(this._panel.webview)
  }

  public static render(extensionUri: Uri, email: Email) {
    const existing = EmailView.panels.get(email.id)
    if (existing) {
      try {
        existing._panel.reveal(ViewColumn.One)
        existing._panel.title = email.subject
        existing.email = email
        existing._panel.webview.html = existing._getWebviewContent(
          existing._panel.webview,
          extensionUri,
        )
        return
      } catch (err) {
        window.showErrorMessage(
          'Failed to refresh the email panel. Reopening a new panel.',
        )
        try {
          existing.dispose()
        } catch (_disposeError) {}
      }
    }

    const panel = window.createWebviewPanel(
      'EmailView',
      email.subject,
      ViewColumn.One,
      {
        enableScripts: true,
        enableCommandUris: true,
        retainContextWhenHidden: true,
        localResourceRoots: [Uri.joinPath(extensionUri, 'out')],
      },
    )

    const view = new EmailView(panel, extensionUri, email)
    EmailView.panels.set(email.id, view)
  }

  public dispose() {
    try {
      if (this.email && this.email.id) {
        EmailView.panels.delete(this.email.id)
      }
    } catch (e) {}
    this._panel.dispose()

    while (this._disposables.length) {
      const disposable = this._disposables.pop()
      if (disposable) {
        disposable.dispose()
      }
    }
  }

  /**
   * Defines and returns the HTML that should be rendered within the webview panel.
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(webview: Webview, extensionUri: Uri) {
    const webviewUri = getUri(webview, extensionUri, ['out', 'webview.js'])
    const codiconsUri = getUri(webview, extensionUri, ['out', 'codicon.css'])
    const myStylesUri = getUri(webview, extensionUri, ['out', 'main.css'])

    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${webview.cspSource}; style-src ${webview.cspSource} https: 'unsafe-inline'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource} https: data:; frame-src data:;">
          <link href="${myStylesUri}" rel="stylesheet" />
          <link href="${codiconsUri}" rel="stylesheet" id="vscode-codicon-stylesheet" />
      </head>
      <body>
          <div id="root"></div>
          <script type="module" src="${webviewUri}"></script>
      </body>
    </html>
    `
  }

  private _buildViewData(email: Email): AppViewData {
    const compatibilityResult = new EmailCompatibilityService(
      email.html,
      getConfig('compatibilityClients'),
    )

    const emailDataUrl = formatStringToBase64DataUrl(email.html)
    let compatibilityRows: AppViewData['compatibilityRows'] = []
    try {
      const parsed = JSON.parse(compatibilityResult.formatToRowColumnData())
      if (Array.isArray(parsed)) {
        compatibilityRows = parsed as AppViewData['compatibilityRows']
      }
    } catch (_error) {
      window.showWarningMessage(
        'Email compatibility data could not be parsed. Showing empty results.',
      )
    }

    const attachmentIdCounts = new Map<string, number>()
    const attachments = email.attachments.map((attachment, index) => {
      const filePath = attachment.fileUrl?.path ?? null
      const baseId = filePath
        ? `path:${filePath}`
        : `meta:${attachment.fileName}::${attachment.length}::${attachment.contentType}::${index}`

      const duplicateCount = attachmentIdCounts.get(baseId) ?? 0
      attachmentIdCounts.set(baseId, duplicateCount + 1)

      return {
        id: duplicateCount === 0 ? baseId : `${baseId}::${duplicateCount}`,
        fileName: attachment.fileName,
        filePath,
      }
    })

    return {
      email: {
        id: email.id,
        subject: email.subject,
        from: email.from,
        to: email.to,
        cc: email.cc,
        bcc: email.bcc,
        text: email.text,
        receivedDateTime: email.receivedDateTime,
      },
      attachments,
      emailDataUrl,
      compatibilityRows,
      defaultTab: getConfig('defaultEmailView'),
    }
  }

  private _isWebviewReadyMessage(
    message: unknown,
  ): message is WebviewReadyMessage {
    if (typeof message !== 'object' || message === null) {
      return false
    }

    const candidate = message as Record<string, unknown>
    return candidate.type === 'webview-ready'
  }

  private _isWebviewCommandMessage(
    message: unknown,
  ): message is WebviewCommandMessage {
    if (typeof message !== 'object' || message === null) {
      return false
    }

    const candidate = message as Record<string, unknown>
    if (candidate.command === WebviewCommand.OpenAttachment) {
      return typeof candidate.fileUrl === 'string'
    }

    return (
      candidate.command === WebviewCommand.DownloadEml ||
      candidate.command === WebviewCommand.OpenSource ||
      candidate.command === WebviewCommand.CopyId
    )
  }

  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: unknown) => {
        if (this.email === undefined) {
          return
        }

        if (this._isWebviewReadyMessage(message)) {
          const initMessage: ExtensionToWebviewMessage = {
            type: 'init',
            data: this._buildViewData(this.email),
          }
          void webview.postMessage(initMessage)
          return
        }

        if (!this._isWebviewCommandMessage(message)) {
          return
        }

        const command = message.command
        switch (command) {
          case WebviewCommand.DownloadEml:
            openInNewEditor(`${this.email.id}.eml`, this.email.source).catch(
              (_error) => {},
            )
            break

          case WebviewCommand.OpenAttachment:
            let fileName: string =
              message.fileUrl.split('/').pop() ?? 'attachment'
            openInNewEditor(fileName, Uri.parse(message.fileUrl))
            break

          case WebviewCommand.OpenSource:
            openInNewEditor(
              `${this.email.subject}.html`,
              this.email.html,
            ).catch((_error) => {})

            break

          case WebviewCommand.CopyId:
            const normalizedId = JSON.stringify(this.email.id)
            env.clipboard.writeText(normalizedId).then(() => {
              window.showInformationMessage('Email ID copied to clipboard')
            })
            break
        }
      },
      undefined,
      this._disposables,
    )
  }
}
