import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface ClaudeConfigPaths {
  globalConfigPath: string
  workspaceConfigPath?: string
}

export interface ClaudePostieConfig {
  type: 'stdio'
  command: string
  args: string[]
  env: Record<string, string>
}

export function getDefaultClaudeConfigPaths(
  workspaceRoot?: string
): ClaudeConfigPaths {
  const globalConfigPath = path.join(os.homedir(), '.mcp.json')
  const workspaceConfigPath = workspaceRoot
    ? path.join(workspaceRoot, '.mcp.json')
    : undefined

  return { globalConfigPath, workspaceConfigPath }
}

export function writeClaudeConfigs(params: {
  paths: ClaudeConfigPaths
  postieConfig: ClaudePostieConfig
}): string[] {
  const written: string[] = []

  updateClaudeConfigFile(params.paths.globalConfigPath, params.postieConfig)
  written.push(params.paths.globalConfigPath)

  if (params.paths.workspaceConfigPath) {
    updateClaudeConfigFile(params.paths.workspaceConfigPath, params.postieConfig)
    written.push(params.paths.workspaceConfigPath)
  }

  return written
}

function updateClaudeConfigFile(
  filePath: string,
  postieConfig: ClaudePostieConfig
) {
  ensureDirectory(path.dirname(filePath))
  const config = readConfigFile(filePath)

  if (!config.mcpServers || typeof config.mcpServers !== 'object') {
    config.mcpServers = {}
  }

  ;(config.mcpServers as Record<string, unknown>).postie = postieConfig

  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf8')
}

function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function readConfigFile(filePath: string): Record<string, unknown> {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const raw = fs.readFileSync(filePath, 'utf8').trim()
  if (!raw) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    throw new Error(`Invalid JSON in ${filePath}`)
  }

  return {}
}
