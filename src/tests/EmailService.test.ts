import { EmailService } from '../EmailService'
import { EmailStorageManager } from '../EmailStorageManager'
import { SmtpConnectionManager } from '../SMTPConnectionManager'
import { SMTPServer } from 'smtp-server'
import * as vscode from 'vscode'

jest.mock('vscode')
jest.mock('smtp-server')
jest.mock('../EmailStorageManager')
jest.mock('../SMTPConnectionManager')
jest.mock('mailparser')

jest.mock('../utilities/getConfig', () => ({
  getConfig: jest.fn().mockImplementation((key: string) => {
    const config: { [key: string]: any } = {
      runServerOnStartup: true,
      smtpServerPort: 25,
      maxEmailSize: 10485760,
      smtpUsername: 'testuser',
      smtpPassword: 'testpass',
      allowExternalMails: false,
      maxStoredEmailsCount: 100,
      showNewEmailNotification: true,
    }
    return config[key]
  }),
}))

describe('EmailService', () => {
  let emailService: EmailService
  let mockContext: Partial<vscode.ExtensionContext>
  let mockEmailStorageManager: jest.Mocked<EmailStorageManager>
  let mockSmtpConnectionManager: jest.Mocked<SmtpConnectionManager>

  beforeEach(() => {
    mockContext = {
      subscriptions: [],
      globalStorageUri: vscode.Uri.file('/mock/storage'),
    }

    mockEmailStorageManager = new EmailStorageManager(
      mockContext as vscode.ExtensionContext
    ) as jest.Mocked<EmailStorageManager>
    mockSmtpConnectionManager = new SmtpConnectionManager(
      25
    ) as jest.Mocked<SmtpConnectionManager>

    EmailStorageManager.prototype.constructor = jest
      .fn()
      .mockImplementation(() => mockEmailStorageManager)
    SmtpConnectionManager.prototype.constructor = jest
      .fn()
      .mockImplementation(() => mockSmtpConnectionManager)

    emailService = new EmailService(mockContext as vscode.ExtensionContext)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('getInstance returns singleton instance', () => {
    const instance1 = EmailService.getInstance(
      mockContext as vscode.ExtensionContext
    )
    const instance2 = EmailService.getInstance(
      mockContext as vscode.ExtensionContext
    )
    expect(instance1).toBe(instance2)
  })

  test('constructor initializes with correct state', () => {
    expect(emailService.isRunning).toBe(true)
  })

  test('startServer initializes SMTP server', () => {
    const mockListen = jest.fn()
    const mockOn = jest.fn()
    ;(SMTPServer as unknown as jest.Mock).mockImplementation(() => ({
      listen: mockListen,
      on: mockOn,
    }))

    emailService.startServer()

    expect(SMTPServer).toHaveBeenCalled()
    expect(mockListen).toHaveBeenCalledWith(25, expect.any(Function))
    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function))
  })

  test('getEmailSummaries returns formatted email summaries', () => {
    const mockEmails = [
      {
        id: '1',
        subject: 'Test subject',
        to: 'test-to@example.com',
        from: 'test-from@example.com',
        opened: false,
        receivedDateTime: new Date('2023-01-01T12:00:00Z'),
      },
    ]
    ;(emailService as any).emails = mockEmails

    const summaries = emailService.getEmailSummaries()

    expect(summaries).toHaveLength(1)
    expect(summaries[0]).toHaveProperty('label')
    expect(summaries[0].label).toContain('Test')
    expect(summaries[0].label).toContain(
      '[12:00:00] Test subject - test-from@example.com'
    )
  })

  test('getEmailDetails throws error when email not found', async () => {
    await expect(emailService.getEmailDetails('1')).rejects.toThrow(
      'Email not found'
    )
  })

  test('deleteEmailDetails removes email', () => {
    ;(emailService as any).emails = [{ id: '1' }, { id: '2' }]

    emailService.deleteEmailDetails('1')

    expect((emailService as any).emails).toHaveLength(1)
    expect((emailService as any).emails[0].id).toBe('2')
  })

  test('markEmailAsRead updates email status', () => {
    ;(emailService as any).emails = [{ id: '1', opened: false }]

    emailService.markEmailAsRead('1')

    expect((emailService as any).emails[0].opened).toBe(true)
  })
})
