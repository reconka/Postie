import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { resolvePostieStoragePath } from '../../mcp/storageDiscovery'
import { buildMcpConfig } from '../../mcp/cliConfig'

function createTempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'postie-mcp-cli-'))
}

describe('resolvePostieStoragePath', () => {
  test('finds Postie.postie directly', () => {
    const root = createTempRoot()
    const storagePath = path.join(root, 'Postie.postie')
    fs.mkdirSync(storagePath, { recursive: true })

    expect(resolvePostieStoragePath({ roots: [root] })).toBe(storagePath)
  })

  test('finds postie.postie directly', () => {
    const root = createTempRoot()
    const storagePath = path.join(root, 'postie.postie')
    fs.mkdirSync(storagePath, { recursive: true })

    expect(resolvePostieStoragePath({ roots: [root] })).toBe(storagePath)
  })

  test('falls back to any .postie directory', () => {
    const root = createTempRoot()
    const storagePath = path.join(root, 'custom.postie')
    fs.mkdirSync(storagePath, { recursive: true })

    expect(resolvePostieStoragePath({ roots: [root] })).toBe(storagePath)
  })

  test('throws when multiple candidates are found', () => {
    const rootA = createTempRoot()
    const rootB = createTempRoot()
    fs.mkdirSync(path.join(rootA, 'Postie.postie'), { recursive: true })
    fs.mkdirSync(path.join(rootB, 'Postie.postie'), { recursive: true })

    expect(() =>
      resolvePostieStoragePath({ roots: [rootA, rootB] })
    ).toThrow(
      /Multiple Postie storage folders/
    )
  })

  test('throws when no candidates are found', () => {
    const root = createTempRoot()

    expect(() => resolvePostieStoragePath({ roots: [root] })).toThrow(
      /Unable to locate Postie storage/
    )
  })
})

describe('buildMcpConfig', () => {
  test('formats config with required env', () => {
    const { config, json } = buildMcpConfig({
      mcpServerPath: '/tmp/mcpServer.js',
      storagePath: '/tmp/Postie.postie',
      version: '1.2.3',
    })

    const parsed = JSON.parse(json) as typeof config
    expect(parsed).toMatchObject({
      mcpServers: {
        postie: {
          command: 'node',
          args: ['/tmp/mcpServer.js'],
          env: {
            POSTIE_STORAGE_PATH: '/tmp/Postie.postie',
            POSTIE_VERSION: '1.2.3',
          },
        },
      },
    })
  })

  test('includes optional env overrides when provided', () => {
    const { json } = buildMcpConfig({
      mcpServerPath: '/tmp/mcpServer.js',
      storagePath: '/tmp/Postie.postie',
      version: '1.2.3',
      compatibilityClients: 'gmail.ios,outlook.windows',
      screenshotPresets: 'iphone-14-pro-max,pixel-7',
    })

    const parsed = JSON.parse(json)
    expect(parsed.mcpServers.postie.env).toMatchObject({
      POSTIE_COMPATIBILITY_CLIENTS: 'gmail.ios,outlook.windows',
      POSTIE_SCREENSHOT_PRESETS: 'iphone-14-pro-max,pixel-7',
    })
  })
})
