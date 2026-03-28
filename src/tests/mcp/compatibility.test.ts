import { checkEmailCompatibility } from '../../mcp/compatibility'

const mockEmailCompatibilityService = jest.fn()

jest.mock('../../EmailCompatibilityService', () => ({
  EmailCompatibilityService: class {
    public processor: any
    constructor(htmlBody: string, clientConfig: string[]) {
      this.processor = mockEmailCompatibilityService(htmlBody, clientConfig)
    }
  },
}))

describe('MCP compatibility adapter', () => {
  beforeEach(() => {
    mockEmailCompatibilityService.mockReset()
  })

  test('returns success row when compatibility processor succeeds', () => {
    mockEmailCompatibilityService.mockReturnValue({
      success: true,
      errors: [],
      warnings: [],
    })

    const result = checkEmailCompatibility('<html><body>Hello</body></html>', [
      'gmail.ios',
    ])

    expect(result.success).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.rows).toEqual([
      {
        ReportType: 'Email Compatibility',
        Result: 'Success, No issues found',
      },
    ])
  })

  test('maps errors and warnings into deterministic issue rows', () => {
    mockEmailCompatibilityService.mockReturnValue({
      success: false,
      errors: ["'border-radius' is not supported in outlook.windows"],
      warnings: ["'position' has partial support in gmail.ios"],
    })

    const result = checkEmailCompatibility('<html><body>Hello</body></html>', [
      'outlook.windows',
      'gmail.ios',
    ])

    expect(result.success).toBe(false)
    expect(result.errors).toHaveLength(1)
    expect(result.warnings).toHaveLength(1)
    expect(result.errors[0]).toMatchObject({
      reportType: 'errors',
      client: 'outlook windows',
    })
    expect(result.warnings[0]).toMatchObject({
      reportType: 'warnings',
      client: 'gmail ios',
    })
    expect(result.rows).toHaveLength(2)
  })
})
