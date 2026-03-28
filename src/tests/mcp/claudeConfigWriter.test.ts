import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { writeClaudeConfigs } from '../../mcp/claudeConfigWriter'

function createTempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'postie-claude-config-'))
}

describe('claudeConfigWriter', () => {
  test('creates new config when missing', () => {
    const root = createTempRoot()
    const globalConfigPath = path.join(root, '.mcp.json')

    writeClaudeConfigs({
      paths: { globalConfigPath },
      postieConfig: {
        type: 'stdio',
        command: 'node',
        args: ['/tmp/mcpServer.js'],
        env: { POSTIE_STORAGE_PATH: '/tmp/postie' },
      },
    })

    const content = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'))
    expect(content.mcpServers.postie.command).toBe('node')
  })

  test('merges with existing servers and overwrites postie only', () => {
    const root = createTempRoot()
    const globalConfigPath = path.join(root, '.mcp.json')
    fs.mkdirSync(path.dirname(globalConfigPath), { recursive: true })
    fs.writeFileSync(
      globalConfigPath,
      JSON.stringify(
        {
          mcpServers: {
            existing: { command: 'python' },
            postie: { command: 'old' },
          },
        },
        null,
        2
      ),
      'utf8'
    )

    writeClaudeConfigs({
      paths: { globalConfigPath },
      postieConfig: {
        type: 'stdio',
        command: 'node',
        args: ['/tmp/mcpServer.js'],
        env: { POSTIE_STORAGE_PATH: '/tmp/postie' },
      },
    })

    const content = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'))
    expect(content.mcpServers.existing.command).toBe('python')
    expect(content.mcpServers.postie.command).toBe('node')
  })

  test('writes workspace config when provided', () => {
    const root = createTempRoot()
    const workspace = createTempRoot()
    const globalPath = path.join(root, '.mcp.json')
    const workspacePath = path.join(workspace, '.mcp.json')

    const written = writeClaudeConfigs({
      paths: {
        globalConfigPath: globalPath,
        workspaceConfigPath: workspacePath,
      },
      postieConfig: {
        type: 'stdio',
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
