import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { writeCodexConfigs } from '../../mcp/codexConfigWriter'

function createTempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'postie-codex-config-'))
}

describe('codexConfigWriter', () => {
  test('creates new config when missing', () => {
    const root = createTempRoot()
    const globalConfigPath = path.join(root, '.codex', 'config.toml')

    writeCodexConfigs({
      paths: { globalConfigPath },
      postieConfig: {
        command: 'node',
        args: ['/tmp/mcpServer.js'],
        env: { POSTIE_STORAGE_PATH: '/tmp/postie' },
      },
    })

    const content = fs.readFileSync(globalConfigPath, 'utf8')
    expect(content).toContain('[mcp_servers.postie]')
    expect(content).toContain('POSTIE_STORAGE_PATH')
  })

  test('merges without removing other servers', () => {
    const root = createTempRoot()
    const globalConfigPath = path.join(root, '.codex', 'config.toml')
    fs.mkdirSync(path.dirname(globalConfigPath), { recursive: true })
    fs.writeFileSync(
      globalConfigPath,
      [
        '[mcp_servers.other]',
        'command = "echo"',
        '',
        '[mcp_servers.postie]',
        'command = "old"',
        '',
      ].join('\n'),
      'utf8'
    )

    writeCodexConfigs({
      paths: { globalConfigPath },
      postieConfig: {
        command: 'node',
        args: ['/tmp/mcpServer.js'],
        env: { POSTIE_STORAGE_PATH: '/tmp/postie' },
      },
    })

    const content = fs.readFileSync(globalConfigPath, 'utf8')
    expect(content).toContain('[mcp_servers.other]')
    expect(content).toContain('command = "node"')
  })

  test('writes workspace config when provided', () => {
    const root = createTempRoot()
    const workspace = createTempRoot()
    const globalPath = path.join(root, '.codex', 'config.toml')
    const workspacePath = path.join(workspace, '.codex', 'config.toml')

    const written = writeCodexConfigs({
      paths: {
        globalConfigPath: globalPath,
        workspaceConfigPath: workspacePath,
      },
      postieConfig: {
        command: 'node',
        args: ['/tmp/mcpServer.js'],
        env: { POSTIE_STORAGE_PATH: '/tmp/postie' },
      },
    })

    expect(written).toEqual([globalPath, workspacePath])
    expect(fs.existsSync(globalPath)).toBe(true)
    expect(fs.existsSync(workspacePath)).toBe(true)
  })
})
