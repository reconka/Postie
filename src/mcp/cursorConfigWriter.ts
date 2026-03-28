import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface CursorConfigPaths {
  globalConfigPath: string
  workspaceConfigPath?: string
}

export function getDefaultCursorConfigPaths(
  workspaceRoot?: string
): CursorConfigPaths {
  const globalConfigPath = path.join(os.homedir(), '.cursor', 'mcp.json')
  const workspaceConfigPath = workspaceRoot
    ? path.join(workspaceRoot, '.cursor', 'mcp.json')
    : undefined

  return { globalConfigPath, workspaceConfigPath }
}

export function updateCursorMcpConfigFile(
  filePath: string,
  postieEntry: Record<string, unknown>
): void {
  ensureDirectory(path.dirname(filePath))

  const existing = readConfigFile(filePath)
  const config = normalizeConfig(existing)

  if (!config.mcpServers || typeof config.mcpServers !== 'object') {
    config.mcpServers = {}
  }

  ;(config.mcpServers as Record<string, unknown>).postie = postieEntry

  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8')
}

export function writeCursorMcpConfigs(params: {
  paths: CursorConfigPaths
  postieEntry: Record<string, unknown>
}): string[] {
  const written: string[] = []
  updateCursorMcpConfigFile(params.paths.globalConfigPath, params.postieEntry)
  written.push(params.paths.globalConfigPath)

  if (params.paths.workspaceConfigPath) {
    updateCursorMcpConfigFile(
      params.paths.workspaceConfigPath,
      params.postieEntry
    )
    written.push(params.paths.workspaceConfigPath)
  }

  return written
}

function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function readConfigFile(filePath: string): unknown {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const raw = fs.readFileSync(filePath, 'utf8').trim()
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    throw new Error(`Invalid JSON in ${filePath}`)
  }
}

function normalizeConfig(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}
