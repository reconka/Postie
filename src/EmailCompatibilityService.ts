import { doIUseEmail } from 'doiuse-email'
import { formatCompatibilityResults } from './utilities/formatters'

export class EmailCompatibilityService {
  public processor: any
  constructor(htmlBody: string, clientConfig: string[] = ['*']) {
    try {
      this.processor = doIUseEmail(htmlBody, { emailClients: clientConfig })
    } catch (error) {
      if (error instanceof Error) {
        this.processor = {
          success: false,
          errors: [error.message],
          warnings: [],
        }
      }
    }
  }

  public formatToRowColumnData(): string {
    if (this.processor?.success) {
      return JSON.stringify([
        {
          ReportType: 'Email Compatibility',
          Result: 'Success, No issues found',
        },
      ])
    }

    const { errors, warnings } = this.processor

    return JSON.stringify([
      ...formatCompatibilityResults(errors, 'errors'),
      ...formatCompatibilityResults(warnings, 'warnings'),
    ])
  }
}
