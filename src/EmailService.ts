import { EventEmitter, Event, ExtensionContext, window, commands } from 'vscode'
import {
  SMTPServer,
  SMTPServerAuthentication,
  SMTPServerSession,
} from 'smtp-server'
import { updateServerState } from './utilities/updateServerState'
import type { Email, EmailSummary } from './types/Email'
import { EmailStorageManager } from './EmailStorageManager'
import { getConfig } from './utilities/getConfig'
import { formatDateToTime, formatAddresses } from './utilities/formatters'
import { simpleParser, ParsedMail } from 'mailparser'
import { SmtpConnectionManager } from './SMTPConnectionManager'

export class EmailService {
  private emails: EmailSummary[] = []
  private static instance: EmailService
  private server: SMTPServer | null = null
  public isRunning: boolean = false
  private emailStorageManager: EmailStorageManager

  private _onEmailsChanged: EventEmitter<void> = new EventEmitter<void>()
  public readonly onEmailsChanged: Event<void> = this._onEmailsChanged.event
  private smtpConnectionManager: SmtpConnectionManager

  constructor(private context: ExtensionContext) {
    this.emailStorageManager = new EmailStorageManager(context)
    let runServerOnStartup = getConfig('runServerOnStartup') as boolean

    this.smtpConnectionManager = new SmtpConnectionManager(
      getConfig('smtpServerPort') as number
    )
    this.emailStorageManager.watchEmailSummaries((emails) => {
      this.emails = emails
      this._onEmailsChanged.fire()
    })

    this.setServerState(runServerOnStartup)
    if (runServerOnStartup) {
      this.startServer()
    }
    this.emails = this.emailStorageManager.getEmailSummaries()
  }

  public static getInstance(context: ExtensionContext): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService(context)
    }
    return EmailService.instance
  }

  public startServer() {
    if (this.server) {
      this.stopServer()
    }

    this.server = new SMTPServer({
      secure: false,
      size: getConfig('maxEmailSize') as number,
      authMethods: ['PLAIN', 'LOGIN'],

      onAuth: (
        auth: SMTPServerAuthentication,
        session: SMTPServerSession,
        callback
      ) => {
        const isLocalhostAllowed =
          session.clientHostname === '[127.0.0.1]' ||
          getConfig('allowExternalMails')
        const isValidCredentials =
          auth.username === getConfig('smtpUsername') &&
          auth.password === getConfig('smtpPassword')

        if (!isLocalhostAllowed) {
          return callback(new Error('Only localhost is allowed to send emails'))
        }

        if (!isValidCredentials) {
          return callback(new Error('Invalid username or password'))
        }

        return callback(null, { user: auth.username })
      },
      onData: (stream, _session, callback) => {
        let mailData = ''
        let totalSize = 0
        stream.on('data', (chunk) => {
          mailData += chunk
          totalSize += chunk.length
        })
        stream.on('end', () => {
          if (totalSize > (getConfig('maxEmailSize') as number)) {
            let err = new Error('Message exceeds fixed maximum message size')
            return callback(err)
          }
          this.handleNewEmail(mailData)
          callback()
        })
      },
    })

    this.emails = this.emailStorageManager.getEmailSummaries()
    this._onEmailsChanged.fire()

    this.server.listen(getConfig('smtpServerPort') as number, () => {
      this.setServerState(true)
      window.showInformationMessage(
        `📮 Postie is listening on port ${getConfig('smtpServerPort')} `
      )
    })

    this.server.on('error', async () => {
      console.log('Trying to connect to the SMTP server')
      try {
        await this.smtpConnectionManager.connectToSmtpServer()
      } catch (error) {
        this.setServerState(false)
        if (error instanceof Error) {
          window.showErrorMessage(error.message)
        } else {
          window.showErrorMessage(
            'An unknown error occurred while connecting to the SMTP server'
          )
        }
      }
    })
  }

  public async stopServer() {
    this.emails = []
    this._onEmailsChanged.fire()

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close()
        this.setServerState(false)

        resolve()
      })
      this.server = null
    }
    await this.smtpConnectionManager.closeConnection()
  }

  public getEmailSummaries(): { label: string; email: EmailSummary }[] {
    return this.emails.map((email: EmailSummary) => {
      const sentTime = formatDateToTime(email.receivedDateTime)
      return {
        label: `[${sentTime}] ${email.subject} - ${email.from}`,
        email: email,
      }
    })
  }

  public deleteEmailSummaries(): void {
    this.emails = []
    this._onEmailsChanged.fire()

    this.emailStorageManager.clearEmailStorage()
    window.showInformationMessage('All emails deleted successfully.')
  }

  public async getEmailDetails(emailId: string): Promise<Email> {
    try {
      const email = await this.emailStorageManager.getEmailFile(emailId)
      if (!email) {
        throw new Error('Email not found')
      }
      return email
    } catch (error) {
      window.showErrorMessage(`Error loading email: ${error}`)
      throw error
    }
  }

  public deleteEmailDetails(emailId: string): void {
    this.emails = this.emails.filter((e) => e.id !== emailId)
    this.emailStorageManager.removeEmailFile(emailId)
    this.emailStorageManager.updateEmailSummaries(this.emails)
    this._onEmailsChanged.fire()
  }

  private async handleNewEmail(rawEmail: string): Promise<void> {
    try {
      const parsedEmail: ParsedMail = await simpleParser(rawEmail)

      const email: Email = {
        id: parsedEmail.messageId || Date.now().toString(),
        receivedDateTime: new Date().toISOString(),
        subject: parsedEmail.subject || 'No Subject',
        from: formatAddresses(parsedEmail.from),
        to: formatAddresses(parsedEmail.to),
        cc: formatAddresses(parsedEmail.cc),
        bcc: formatAddresses(parsedEmail.bcc),
        text: parsedEmail.text || '',
        html: parsedEmail.html || '',
        source: rawEmail,
        attachments: parsedEmail.attachments.map((att) => ({
          contentType: att.contentType,
          fileName: att.filename || '',
          contentDisposition: att.contentDisposition || '',
          generatedFileName: att.filename || '',
          contentId: att.contentId || '',
          length: att.size || 0,
        })),
      }

      const emailSummary: EmailSummary = {
        id: email.id,
        opened: false,
        subject: email.subject,
        from: email.from,
        to: email.to,
        receivedDateTime: new Date(email.receivedDateTime),
      }

      this.emailStorageManager.storeEmailFile(email)

      if (getConfig('showNewEmailNotification') as boolean) {
        window
          .showInformationMessage(
            `New email: ${emailSummary.subject}`,
            'Open Email'
          )
          .then((value) => {
            if (value === 'Open Email') {
              commands.executeCommand('postie.openEmail', {
                email: emailSummary,
              })
            }
          })
      }

      this.emails.unshift(emailSummary)
      if (this.emails.length > getConfig('maxStoredEmailsCount')) {
        this.emails.pop() // Remove the oldest email if we exceed the limit
      }
      this._onEmailsChanged.fire()
      this.emailStorageManager.updateEmailSummaries(this.emails)
    } catch (error) {
      console.error('Error parsing email:', error)
    }
  }

  public markEmailAsRead(emailId: string): void {
    const email = this.emails.find((e) => e.id === emailId)
    if (email) {
      email.opened = true
      this.emailStorageManager.updateEmailSummaries(this.emails)
      this._onEmailsChanged.fire()
    }
  }

  private setServerState(running: boolean) {
    this.isRunning = running
    updateServerState(running)
  }
}
