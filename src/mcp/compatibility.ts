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

interface CompatibilityProcessor {
  success: boolean
  errors: string[]
  warnings: string[]
}

export function checkEmailCompatibility(
  html: string,
  clients: string[]
): CompatibilityCheckResult {
  const service = new EmailCompatibilityService(html, clients)
  const processor = normalizeCompatibilityProcessor(service.processor)

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

function normalizeCompatibilityProcessor(value: unknown): CompatibilityProcessor {
  if (value && typeof value === 'object') {
    const processor = value as {
      success?: unknown
      errors?: unknown
      warnings?: unknown
    }
    const success = processor.success === true
    const errors = normalizeStringArray(processor.errors)
    const warnings = normalizeStringArray(processor.warnings)
    return { success, errors, warnings }
  }

  return {
    success: false,
    errors: ['Unknown compatibility processing error'],
    warnings: [],
  }
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string') {
    return [value]
  }

  return []
}
