import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  getDefaultCursorConfigPaths,
  updateCursorMcpConfigFile,
  writeCursorMcpConfigs,
} from '../../mcp/cursorConfigWriter'

function createTempRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'postie-cursor-config-'))
}

describe('cursorConfigWriter', () => {
  test('writes new mcp.json when absent', () => {
    const root = createTempRoot()
    const filePath = path.join(root, '.cursor', 'mcp.json')

    updateCursorMcpConfigFile(filePath, { command: 'node' })

    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    expect(parsed.mcpServers.postie.command).toBe('node')
  })

  test('merges with existing servers and overwrites postie only', () => {
    const root = createTempRoot()
    const filePath = path.join(root, '.cursor', 'mcp.json')
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        mcpServers: {
          existing: { command: 'python' },
          postie: { command: 'old' },
        },
      }),
      'utf8'
    )

    updateCursorMcpConfigFile(filePath, { command: 'node' })

    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    expect(parsed.mcpServers.existing.command).toBe('python')
    expect(parsed.mcpServers.postie.command).toBe('node')
  })

  test('creates .cursor directory when missing', () => {
    const root = createTempRoot()
    const filePath = path.join(root, '.cursor', 'mcp.json')

    updateCursorMcpConfigFile(filePath, { command: 'node' })

    expect(fs.existsSync(path.dirname(filePath))).toBe(true)
  })

  test('writes both global and workspace configs', () => {
    const root = createTempRoot()
    const workspace = createTempRoot()
    const paths = getDefaultCursorConfigPaths(workspace)
    const globalPath = path.join(root, '.cursor', 'mcp.json')

    const written = writeCursorMcpConfigs({
      paths: {
        globalConfigPath: globalPath,
        workspaceConfigPath: paths.workspaceConfigPath,
      },
      postieEntry: { command: 'node' },
    })

    expect(written).toEqual([globalPath, paths.workspaceConfigPath])
    expect(fs.existsSync(globalPath)).toBe(true)
    expect(paths.workspaceConfigPath).toBeDefined()
    expect(fs.existsSync(paths.workspaceConfigPath as string)).toBe(true)
  })
})
