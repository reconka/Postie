import nodemailer from 'nodemailer'
import { window } from 'vscode'
import { getConfig } from './utilities/getConfig'

export class SmtpConnectionManager {
  private transporter: nodemailer.Transporter | null = null

  constructor(private readonly port: number) {}

  public async connectToSmtpServer(): Promise<void> {
    if (this.transporter) {
      await this.closeConnection()
    }

    this.transporter = nodemailer.createTransport({
      host: 'localhost',
      port: this.port,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
      auth: {
        user: getConfig('smtpUsername') as string,
        pass: getConfig('smtpPassword') as string,
      },
    })

    try {
      await this.verifyConnection()
      window.showInformationMessage('🎉 Connected to Postie server.')
    } catch (error) {
      await this.handleConnectionError(error)
    }
  }

  private async verifyConnection(): Promise<void> {
    if (!this.transporter) {
      throw new Error('Transporter not initialized')
    }

    await this.transporter.verify()
  }

  private async handleConnectionError(error: unknown): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`😵 Failed to connect as SMTP client: ${errorMessage}`)
  }

  public async closeConnection(): Promise<void> {
    if (this.transporter) {
      await this.transporter.close()
      this.transporter = null
    }
  }
}
