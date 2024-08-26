import {
  Disposable,
  Webview,
  WebviewPanel,
  window,
  Uri,
  ViewColumn,
} from 'vscode'
import { getUri } from '../utilities/getUri'
import { getNonce } from '../utilities/getNonce'
import { Email } from '../types/Email'
import { openInNewEditor } from './utilities/openInNewEditor'
import {
  createTextField,
  createAttachmentButton,
  createBadge,
} from './utilities/uiElements'
import { getConfig } from '../utilities/getConfig'
import { formatStringToBase64DataUrl } from '../utilities/formatters'
import { EmailCompatibilityService } from '../EmailCompatibilityService'

/**
 * This class manages the state and behavior of HelloWorld webview panels.
 *
 * It contains all the data and methods for:
 *
 * - Creating and rendering HelloWorld webview panels
 * - Properly cleaning up and disposing of webview resources when the panel is closed
 * - Setting the HTML (and by proxy CSS/JavaScript) content of the webview panel
 * - Setting message listeners so data can be passed between the webview and extension
 */
export class EmailView {
  public static currentPanel: EmailView | undefined
  private readonly _panel: WebviewPanel
  private _disposables: Disposable[] = []
  private email!: Email

  private constructor(panel: WebviewPanel, extensionUri: Uri, email: Email) {
    this._panel = panel
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables)

    this._panel.webview.html = this._getWebviewContent(
      this._panel.webview,
      extensionUri,
      email
    )

    // Set an event listener to listen for messages passed from the webview context
    this._setWebviewMessageListener(this._panel.webview)
  }

  public static render(extensionUri: Uri, email: Email) {
    // If a webview panel does not already exist create and show a new one
    const panel = window.createWebviewPanel(
      // Panel view type
      'EmailView',
      // Panel title
      email.subject,
      // The editor column the panel should be displayed in
      ViewColumn.One,
      // Extra panel configurations
      {
        enableScripts: true,
        enableCommandUris: true,
        retainContextWhenHidden: true,
        localResourceRoots: [Uri.joinPath(extensionUri, 'out')],
      }
    )

    EmailView.currentPanel = new EmailView(panel, extensionUri, email)
  }

  public dispose() {
    EmailView.currentPanel = undefined
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
   *
   * @remarks This is also the place where *references* to CSS and JavaScript files
   * are created and inserted into the webview HTML.
   *
   * @param webview A reference to the extension webview
   * @param extensionUri The URI of the directory containing the extension
   * @returns A template string literal containing the HTML that should be
   * rendered within the webview panel
   */
  private _getWebviewContent(
    webview: Webview,
    extensionUri: Uri,
    email: Email
  ) {
    const webviewUri = getUri(webview, extensionUri, ['out', 'webview.js'])
    const nonce = getNonce()
    this.email = email

    const compatibilityResult = new EmailCompatibilityService(
      email.html,
      getConfig('compatibilityClients')
    )

    const attachments = createAttachmentButton(email.attachments)

    const emailDataUrl = formatStringToBase64DataUrl(email.html)
    const codiconsUri = getUri(webview, extensionUri, ['out', 'codicon.css'])
    const myStylesUri = getUri(webview, extensionUri, ['out', 'main.css'])

    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none';font-src https: data:;style-src * 'unsafe-inline' nonce-${nonce};img-src * data:; script-src 'nonce-${nonce}'; frame-src data: ;">
          <link href="${myStylesUri}" rel="stylesheet" nonce="${nonce}" />
          <link href="${codiconsUri}" rel="stylesheet" nonce="${nonce}" />
      </head>
      <body>
          ${createTextField('codicon-mail', 'From', email.from)}
          ${createTextField('codicon-book', 'Subject', email.subject)}
          ${createTextField('codicon-account', 'To', email.to)}
          <!-- Hidden panel -->
          <div id="more-info" class="hidden">
            ${createTextField('codicon-broadcast', 'CC', email.cc)}
            ${createTextField('codicon-eye-closed', 'Bcc', email.bcc)}
            ${createTextField(
              'codicon-calendar',
              'Date',
              new Date(email.receivedDateTime).toLocaleString()
            )}
            <p>Attachment(s):</p>
            <div class="buttons-container"> 
                ${attachments}
            </div>
          </div>
          <div class="buttons-container flex m-top">
            <vscode-button id="open-source" appearance="secondary"><span slot="start" class="codicon codicon-file-code"></span> Source </vscode-button>
            <vscode-button id="open-eml" appearance="secondary"><span slot="start" class="codicon codicon-telescope"></span> Open Eml</vscode-button>
            <vscode-button id="show-more">Show More</vscode-button>
          </div>
          <vscode-divider class="m-top" role="separator"></vscode-divider>
          <vscode-panels activeid="${getConfig('defaultEmailView')}">
            <vscode-panel-tab id="mobile">Mobile View</vscode-panel-tab>
            <vscode-panel-tab id="tablet">Tablet View</vscode-panel-tab>
            <vscode-panel-tab id="desktop">Desktop View</vscode-panel-tab>
            <vscode-panel-tab id="textOnly">Text Only</vscode-panel-tab>
            <vscode-panel-tab id="compatibility">Email Client Compatibility
            ${createBadge(compatibilityResult.processor?.errors?.length)}
            </vscode-panel-tab>
            <vscode-panel-view id="view-mobile">
                <div class="container--mobile background--light">
                  <iframe class="full-width full-height" src="${emailDataUrl}"></iframe>
                </div>
            </vscode-panel-view>
            <vscode-panel-view id="view-tablet">
                <div class="container--tablet background--light">
                  <iframe class="full-width full-height" src="${emailDataUrl}" sandbox></iframe>
                </div>
            </vscode-panel-view>
            <vscode-panel-view id="view-desktop">
                <div class="container--desktop background--light">
                  <iframe class="full-width full-height" src="${emailDataUrl}"></iframe>
                </div>
            </vscode-panel-view>
            <vscode-panel-view id="text-only-view">
                <div class>
                  ${email.text}
                </div>
            </vscode-panel-view>
            <vscode-panel-view id="compatibility-view">
                <div>
                  <vscode-data-grid data-rowdata='${compatibilityResult.formatToRowColumnData()}' id="compatibility-grid" aria-label="Compatibility result" row-type="sticky-header"></vscode-data-grid>
                </div>
            </vscode-panel-view>
          </vscode-panels>
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
      </body>
    </html>
    `
  }

  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command
        if (this.email === undefined) {
          return
        }

        switch (command) {
          case 'download-eml':
            openInNewEditor(`${this.email.id}.eml`, this.email.source).catch(
              (_error) => {}
            )
            break

          case 'open-source':
            openInNewEditor(
              `${this.email.subject}.html`,
              this.email.html
            ).catch((_error) => {})

            break
        }
      },
      undefined,
      this._disposables
    )
  }
}
