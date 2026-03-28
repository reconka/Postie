import { mergeSummaryWithEmail, mapEmailDetailToMcp } from '../../mcp/mappers'
import { Email, EmailSummary } from '../../types/Email'

describe('MCP email mappers', () => {
  const summary: EmailSummary = {
    id: 'email-1',
    subject: 'Welcome',
    from: 'sender@example.com',
    to: 'recipient@example.com',
    opened: true,
    receivedDateTime: new Date('2025-01-02T10:20:30.000Z'),
  }

  const email: Email = {
    id: 'email-1',
    receivedDateTime: '2025-01-02T10:20:30.000Z',
    subject: 'Welcome',
    from: 'sender@example.com',
    to: 'recipient@example.com',
    cc: 'cc@example.com',
    bcc: 'bcc@example.com',
    text: 'Plain text body',
    html: '<html><body><h1>Hello</h1></body></html>',
    source: 'raw email',
    attachments: [
      {
        contentType: 'image/png',
        fileName: 'logo.png',
        fileUrl: {
          fsPath: '/tmp/logo.png',
        } as any,
        length: 128,
      },
    ],
  }

  test('mergeSummaryWithEmail includes html and attachment metadata', () => {
    expect(mergeSummaryWithEmail(summary, email)).toEqual({
      id: 'email-1',
      subject: 'Welcome',
      from: 'sender@example.com',
      to: 'recipient@example.com',
      receivedDateTime: '2025-01-02T10:20:30.000Z',
      opened: true,
      hasHtml: true,
      attachmentCount: 1,
    })
  })

  test('mapEmailDetailToMcp maps attachment file paths and source flags', () => {
    expect(mapEmailDetailToMcp(email, true)).toMatchObject({
      id: 'email-1',
      hasHtml: true,
      hasSource: true,
      opened: true,
      attachmentCount: 1,
      attachments: [
        {
          contentType: 'image/png',
          fileName: 'logo.png',
          filePath: '/tmp/logo.png',
          length: 128,
        },
      ],
    })
  })
})
