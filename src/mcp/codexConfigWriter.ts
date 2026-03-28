import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface CodexConfigPaths {
  globalConfigPath: string
  workspaceConfigPath?: string
}

export interface CodexPostieConfig {
  command: string
  args: string[]
  env: Record<string, string>
}

export function getDefaultCodexConfigPaths(
  workspaceRoot?: string
): CodexConfigPaths {
  const globalConfigPath = path.join(os.homedir(), '.codex', 'config.toml')
  const workspaceConfigPath = workspaceRoot
    ? path.join(workspaceRoot, '.codex', 'config.toml')
    : undefined

  return { globalConfigPath, workspaceConfigPath }
}

export function writeCodexConfigs(params: {
  paths: CodexConfigPaths
  postieConfig: CodexPostieConfig
}): string[] {
  const written: string[] = []

  updateCodexConfigFile(params.paths.globalConfigPath, params.postieConfig)
  written.push(params.paths.globalConfigPath)

  if (params.paths.workspaceConfigPath) {
    updateCodexConfigFile(params.paths.workspaceConfigPath, params.postieConfig)
    written.push(params.paths.workspaceConfigPath)
  }

  return written
}

function updateCodexConfigFile(
  filePath: string,
  postieConfig: CodexPostieConfig
) {
  ensureDirectory(path.dirname(filePath))
  const existing = fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8')
    : ''
  const cleaned = stripPostieSections(existing)
  const next = appendPostieConfig(cleaned, postieConfig)
  fs.writeFileSync(filePath, next, 'utf8')
}

function ensureDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function stripPostieSections(content: string): string {
  const lines = content.split(/\r?\n/)
  const output: string[] = []
  const skipSections = new Set(['mcp_servers.postie', 'mcp_servers.postie.env'])
  let skipping = false

  for (const line of lines) {
    const match = line.match(/^\s*\[(.+?)\]\s*$/)
    if (match) {
      const sectionName = match[1]
      if (skipSections.has(sectionName)) {
        skipping = true
        continue
      }
      if (skipping) {
        skipping = false
      }
    }

    if (skipping) {
      continue
    }

    output.push(line)
  }

  return output.join('\n').trimEnd()
}

function appendPostieConfig(
  content: string,
  postieConfig: CodexPostieConfig
): string {
  const block = [
    '[mcp_servers.postie]',
    `command = ${toTomlString(postieConfig.command)}`,
    `args = ${toTomlArray(postieConfig.args)}`,
    '',
    '[mcp_servers.postie.env]',
    ...Object.entries(postieConfig.env).map(
      ([key, value]) => `${key} = ${toTomlString(value)}`
    ),
    '',
  ].join('\n')

  if (!content) {
    return block.trimEnd() + '\n'
  }

  return `${content}\n\n${block}`.trimEnd() + '\n'
}

function toTomlString(value: string): string {
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `"${escaped}"`
}

function toTomlArray(values: string[]): string {
  const entries = values.map((value) => toTomlString(value))
  return `[${entries.join(', ')}]`
}
