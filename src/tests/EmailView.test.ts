import { EmailView } from '../panels/EmailView'
import type { Email } from '../types/Email'

let onDidReceiveMessageHandler:
  | ((message: unknown) => void)
  | undefined

var postMessageMock: jest.Mock<Promise<boolean>, [unknown]>

jest.mock('../utilities/getUri', () => ({
  getUri: () => 'mock://resource',
}))

jest.mock('../EmailCompatibilityService', () => ({
  EmailCompatibilityService: jest.fn().mockImplementation(() => ({
    formatToRowColumnData: () => '[]',
  })),
}))

jest.mock('../utilities/getConfig', () => ({
  getConfig: (key: string) => {
    if (key === 'compatibilityClients') {
      return []
    }
    if (key === 'defaultEmailView') {
      return 'desktop'
    }
    return undefined
  },
}))

jest.mock('../utilities/formatters', () => ({
  formatStringToBase64DataUrl: () => 'data:text/html;base64,SGVsbG8=',
}))

jest.mock('vscode', () => {
  postMessageMock = jest.fn(async (_message: unknown) => true)

  const mockPanel = {
    title: '',
    reveal: jest.fn(),
    dispose: jest.fn(),
    onDidDispose: jest.fn((_callback: () => void) => ({
      dispose: jest.fn(),
    })),
    webview: {
      cspSource: 'vscode-resource',
      html: '',
      asWebviewUri: jest.fn((uri: unknown) => uri),
      onDidReceiveMessage: jest.fn((callback: (message: unknown) => void) => {
        onDidReceiveMessageHandler = callback
        return { dispose: jest.fn() }
      }),
      postMessage: postMessageMock,
    },
  }

  return {
    window: {
      createWebviewPanel: jest.fn(() => mockPanel),
      showErrorMessage: jest.fn(),
      showWarningMessage: jest.fn(),
      showInformationMessage: jest.fn(),
    },
    env: {
      language: 'en-US',
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    },
    ViewColumn: {
      One: 1,
    },
    Uri: {
      parse: jest.fn((value: string) => ({ value })),
      joinPath: jest.fn(() => ({ value: 'mock://out' })),
    },
    l10n: {
      t: (message: string, ...args: Array<string | number>) =>
        message.replace(/\{(\d+)\}/g, (_, idx) => String(args[Number(idx)] ?? '')),
    },
  }
})

describe('EmailView', () => {
  beforeEach(() => {
    EmailView.panels.clear()
    onDidReceiveMessageHandler = undefined
    postMessageMock.mockClear()
  })

  test('sends localized strings in init payload after webview ready', async () => {
    const email: Email = {
      id: 'msg-1',
      subject: 'Hello',
      from: 'sender@example.com',
      to: 'dev@example.com',
      cc: '',
      bcc: '',
      text: 'plain text',
      html: '<p>Hello</p>',
      source: '<p>Hello</p>',
      receivedDateTime: new Date('2026-03-30T09:00:00Z').toISOString(),
      attachments: [],
    }

    EmailView.render({} as any, email)
    expect(onDidReceiveMessageHandler).toBeDefined()

    onDidReceiveMessageHandler?.({ type: 'webview-ready' })

    expect(postMessageMock).toHaveBeenCalledTimes(1)
    const initPayload = postMessageMock.mock.calls[0]?.[0] as
      | { type: string; data: { strings: Record<string, string> } }
      | undefined
    expect(initPayload).toBeDefined()
    if (!initPayload) {
      return
    }
    expect(initPayload.type).toBe('init')
    expect(initPayload.data.strings).toMatchObject({
      fromLabel: 'From',
      subjectLabel: 'Subject',
      toLabel: 'To',
      ccLabel: 'CC',
      bccLabel: 'Bcc',
      dateLabel: 'Date',
      sourceButtonLabel: 'Source',
      openEmlButtonLabel: 'Open Eml',
      copyIdButtonLabel: 'Copy Id',
      showMoreButtonLabel: 'Show More',
      showLessButtonLabel: 'Show Less',
      mobileTabLabel: 'Mobile View',
      tabletTabLabel: 'Tablet View',
      desktopTabLabel: 'Desktop View',
      textOnlyTabLabel: 'Text Only',
      compatibilityTabLabel: 'Email Client Compatibility',
      compatibilityTableAriaLabel: 'Compatibility result',
      compatibilityReportTypeHeader: 'Report Type',
      compatibilityResultHeader: 'Result',
      compatibilityClientHeader: 'Client',
    })
  })
})
