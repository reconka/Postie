import fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { randomUUID } from 'crypto'
import { Email } from '../../types/Email'
import { FileEmailStore } from '../../mcp/FileEmailStore'

describe('FileEmailStore screenshot path behavior', () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'postie-file-store-'))
  const store = new FileEmailStore(tempRoot)

  afterAll(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  })

  test('screenshotExists does not create screenshot directories', () => {
    const exists = store.screenshotExists('missing-email', 'iphone-se')
    expect(exists).toBe(false)

    const screenshotDirectory = path.join(
      tempRoot,
      'screenshots',
      'missing-email'
    )
    expect(fs.existsSync(screenshotDirectory)).toBe(false)
  })

  test('getScreenshotWriteFilePath creates screenshot directories', () => {
    const writePath = store.getScreenshotWriteFilePath(
      'existing-email',
      'iphone-se'
    )

    const screenshotDirectory = path.join(
      tempRoot,
      'screenshots',
      'existing-email'
    )
    expect(fs.existsSync(screenshotDirectory)).toBe(true)
    expect(writePath.endsWith(path.join('existing-email', 'iphone-se.png'))).toBe(
      true
    )
  })
})


describe('FileEmailStore email identity compatibility', () => {
  let tempRoot: string
  let store: FileEmailStore

  beforeEach(() => {
    tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'postie-email-identity-'))
    store = new FileEmailStore(tempRoot)
  })

  afterEach(() => {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  })

  test.each([true, false])(
    'round-trips and deletes email (UUID: %s)',
    async (useUuid) => {
      const id = useUuid ? randomUUID() : 'legacy-email'
      const email: Email = {
        id,
        ...(useUuid ? { messageId: '<123.0.456@host>' } : {}),
        receivedDateTime: new Date().toISOString(),
        subject: 'Storage regression',
        from: '',
        to: '',
        cc: '',
        bcc: '',
        text: '',
        html: '',
        source: 'original source',
        attachments: [],
      }
      store.storeEmailFile(email)
      expect(fs.existsSync(path.join(tempRoot, `${id}.json`))).toBe(true)
      expect(store.getEmailFile(id)).toEqual(email)

      const attachmentDirectory = path.join(tempRoot, id)
      fs.mkdirSync(attachmentDirectory)
      fs.writeFileSync(
        path.join(attachmentDirectory, 'attachment.txt'),
        'content',
      )
      const screenshot = store.getScreenshotWriteFilePath(id, 'iphone-se')
      fs.writeFileSync(screenshot, 'screenshot')
      expect(store.listScreenshotFiles()).toEqual([
        { emailId: id, preset: 'iphone-se', filePath: screenshot },
      ])

      // Wait for the store's asynchronous unlink without racing directory cleanup.
      const originalUnlink = fs.unlink.bind(fs)
      const unlink = jest.spyOn(fs, 'unlink')
      try {
        await new Promise<void>((resolve, reject) => {
          unlink.mockImplementationOnce((filePath, callback) => {
            originalUnlink(filePath, (error) => {
              callback(error)
              if (error) {
                reject(error)
              } else {
                resolve()
              }
            })
          })
          store.removeEmailFile(id)
        })
      } finally {
        unlink.mockRestore()
      }
      expect(store.getEmailFile(id)).toBeUndefined()
      expect(fs.existsSync(attachmentDirectory)).toBe(false)
      expect(store.screenshotExists(id, 'iphone-se')).toBe(false)
    },
  )
})
