import { EmailCompatibilityService } from '../EmailCompatibilityService'
import { formatCompatibilityResults } from '../utilities/formatters'

export interface CompatibilityIssue {
  reportType: 'errors' | 'warnings'
  result: string
  client: string
}

export interface CompatibilityRow {
  ReportType: string
  Result: string
  Client?: string
}

export interface CompatibilityCheckResult {
  success: boolean
  errors: CompatibilityIssue[]
  warnings: CompatibilityIssue[]
  rows: CompatibilityRow[]
}

export function checkEmailCompatibility(
  html: string,
  clients: string[]
): CompatibilityCheckResult {
  const service = new EmailCompatibilityService(html, clients)
  const processor = service.processor ?? {
    success: false,
    errors: ['Unknown compatibility processing error'],
    warnings: [],
  }

  if (processor.success) {
    return {
      success: true,
      errors: [],
      warnings: [],
      rows: [
        {
          ReportType: 'Email Compatibility',
          Result: 'Success, No issues found',
        },
      ],
    }
  }

  const errorRows = formatCompatibilityResults(processor.errors, 'errors')
  const warningRows = formatCompatibilityResults(processor.warnings, 'warnings')

  const errors: CompatibilityIssue[] = errorRows.map((row) => ({
    reportType: 'errors',
    result: row.Result,
    client: row.Client,
  }))

  const warnings: CompatibilityIssue[] = warningRows.map((row) => ({
    reportType: 'warnings',
    result: row.Result,
    client: row.Client,
  }))

  return {
    success: false,
    errors,
    warnings,
    rows: [...errorRows, ...warningRows],
  }
}
