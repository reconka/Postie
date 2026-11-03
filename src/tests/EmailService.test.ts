import { EmailService } from '../EmailService'
import { EmailStorageManager } from '../EmailStorageManager'
import { SmtpConnectionManager } from '../SMTPConnectionManager'
import { SMTPServer } from 'smtp-server'
import * as vscode from 'vscode'
import { simpleParser, ParsedMail } from 'mailparser'

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

describe('received email storage identity', () => {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

  test.each(['<123.0.456@host>', undefined])(
    'uses a unique UUID for each receipt with Message-ID %s',
    async (messageId) => {
      const service = new EmailService({
        globalStorageUri: vscode.Uri.file('/mock/storage'),
        subscriptions: [],
      } as unknown as vscode.ExtensionContext)
      const instances = jest.mocked(EmailStorageManager).mock.instances
      const storage = instances[instances.length - 1]
      jest.mocked(storage.getEmailSummaries).mockReturnValue([])
      // The constructor's mocked storage initially has no persisted summaries.
      service['emails'] = []
      jest
        .mocked(vscode.window.showInformationMessage)
        .mockResolvedValue(undefined)
      const attachments = ['first.txt', 'second.txt'].map((filename) => ({
        filename,
        contentType: 'text/plain',
        content: Buffer.from('attachment'),
        size: 10,
      }))
      jest.mocked(simpleParser).mockImplementation(
        async () =>
          ({
            messageId,
            subject: 'UUID regression',
            attachments,
          }) as ParsedMail,
      )
      const rawEmail = Buffer.from('Subject: UUID regression\r\n\r\nBody')

      await service['handleNewEmail'](rawEmail)
      await service['handleNewEmail'](rawEmail)

      const stored = jest
        .mocked(storage.storeEmailFile)
        .mock.calls.map(([email]) => email)
      expect(stored).toHaveLength(2)
      expect(stored[0].id).not.toBe(stored[1].id)
      for (const [index, email] of stored.entries()) {
        expect(email.id).toMatch(uuidPattern)
        expect(email.messageId).toBe(messageId)
        expect(email.source).toBe(rawEmail.toString('utf8'))
        attachments.forEach((attachment, attachmentIndex) => {
          expect(storage.storeAttachments).toHaveBeenNthCalledWith(
            index * attachments.length + attachmentIndex + 1,
            email.id,
            attachment,
          )
        })
      }
      expect(service['emails'].map((email) => email.id)).toEqual(
        stored.map((email) => email.id).reverse(),
      )
      expect(storage.updateEmailSummaries).toHaveBeenLastCalledWith(
        service['emails'],
      )
    },
  )

  afterEach(() => {
    jest.clearAllMocks()
  })
})
