import { EmailTreeDataProvider } from '../EmailTreeDataProvider'
import type { EmailService } from '../types/EmailService'

jest.mock('vscode', () => {
  class EventEmitter<T> {
    private listeners: Array<(event: T) => unknown> = []
    public event = (listener: (event: T) => unknown) => {
      this.listeners.push(listener)
      return { dispose: () => {} }
    }
    public fire(event?: T) {
      this.listeners.forEach((listener) => listener(event as T))
    }
  }

  class TreeItem {
    constructor(
      public label: string,
      public collapsibleState: number
    ) {}
  }

  class ThemeIcon {
    constructor(public id: string) {}
  }

  const l10n = {
    t: (message: string, ...args: Array<string | number>) =>
      message.replace(/\{(\d+)\}/g, (_, idx) => String(args[Number(idx)] ?? '')),
  }

  return {
    EventEmitter,
    TreeItem,
    ThemeIcon,
    l10n,
    TreeItemCollapsibleState: {
      None: 0,
    },
  }
})

describe('EmailTreeDataProvider', () => {
  function createEmailServiceMock(
    overrides: Partial<EmailService> = {}
  ): EmailService {
    const onEmailsChanged = ((listener: () => void) => {
      return { dispose: () => listener }
    }) as EmailService['onEmailsChanged']

    return {
      isRunning: true,
      onEmailsChanged,
      deleteEmailSummaries: jest.fn(),
      deleteEmailDetails: jest.fn(),
      stopServer: jest.fn(async () => {}),
      startServer: jest.fn(),
      getEmailSummaries: jest.fn(() => []),
      markEmailAsRead: jest.fn(),
      getEmailDetails: jest.fn(async () => {
        throw new Error('not implemented')
      }),
      getServerConnectionInfo: jest.fn(() => ({
        host: '127.0.0.1',
        port: 587,
        username: 'postie',
        password: 'postie',
      })),
      ...overrides,
    }
  }

  test('returns server info row when running and no emails', async () => {
    const provider = new EmailTreeDataProvider(createEmailServiceMock())
    const children = await provider.getChildren()

    expect(children).toHaveLength(1)
    expect(children[0].type).toBe('server-info')
    expect(children[0].label).toContain('127.0.0.1:587')
    expect(children[0].label).toContain('user=postie')
    expect(children[0].label).toContain('pass=p***e')
  })

  test('returns email rows when running and emails exist', async () => {
    const provider = new EmailTreeDataProvider(
      createEmailServiceMock({
        getEmailSummaries: jest.fn(() => [
          {
            label: '[10:00:00] Hello - sender@example.com',
            email: {
              id: 'msg-1',
              opened: false,
              subject: 'Hello',
              from: 'sender@example.com',
              to: 'dev@example.com',
              receivedDateTime: new Date('2026-03-27T10:00:00Z'),
            },
          },
        ]),
      })
    )

    const children = await provider.getChildren()

    expect(children).toHaveLength(1)
    expect(children[0].type).toBe('email')
    expect((children[0] as any).email.id).toBe('msg-1')
  })

  test('returns empty list when stopped and no emails', async () => {
    const provider = new EmailTreeDataProvider(
      createEmailServiceMock({
        isRunning: false,
      })
    )

    const children = await provider.getChildren()
    expect(children).toEqual([])
  })

  test('server info item has no openEmail command', () => {
    const provider = new EmailTreeDataProvider(createEmailServiceMock())
    const treeItem = provider.getTreeItem({
      type: 'server-info',
      label: 'server info',
    })

    expect((treeItem as any).command).toBeUndefined()
    expect((treeItem as any).contextValue).toBe('server-info')
  })

  test('email item keeps openEmail command', () => {
    const provider = new EmailTreeDataProvider(createEmailServiceMock())
    const treeItem = provider.getTreeItem({
      type: 'email',
      label: '[10:00:00] Hello - sender@example.com',
      email: {
        id: 'msg-1',
        opened: false,
        subject: 'Hello',
        from: 'sender@example.com',
        to: 'dev@example.com',
        receivedDateTime: new Date('2026-03-27T10:00:00Z'),
      },
    })

    expect((treeItem as any).command.command).toBe('postie.openEmail')
    expect((treeItem as any).contextValue).toBe('email')
  })
})
