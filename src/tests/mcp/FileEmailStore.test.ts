import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
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

