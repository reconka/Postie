import * as path from 'path'
import { spawn } from 'child_process'
import { buildMcpConfig } from './cliConfig'
import { resolvePostieStoragePath } from './storageDiscovery'

interface CliOptions {
  printConfig: boolean
  serve: boolean
  storagePath?: string
  compatibilityClients?: string
  screenshotPresets?: string
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    printConfig: false,
    serve: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--print-config') {
      options.printConfig = true
      continue
    }

    if (arg === '--serve') {
      options.serve = true
      continue
    }

    if (arg === '--help' || arg === '-h') {
      printUsage(0)
    }

    if (arg.startsWith('--storage-path')) {
      options.storagePath = readFlagValue(argv, arg, '--storage-path', i)
      if (arg === '--storage-path') {
        i += 1
      }
      continue
    }

    if (arg.startsWith('--compatibility-clients')) {
      options.compatibilityClients = readFlagValue(
        argv,
        arg,
        '--compatibility-clients',
        i
      )
      if (arg === '--compatibility-clients') {
        i += 1
      }
      continue
    }

    if (arg.startsWith('--screenshot-presets')) {
      options.screenshotPresets = readFlagValue(
        argv,
        arg,
        '--screenshot-presets',
        i
      )
      if (arg === '--screenshot-presets') {
        i += 1
      }
      continue
    }

    throw new Error(`Unknown argument: ${arg}`)
  }

  return options
}

function readFlagValue(
  argv: string[],
  arg: string,
  flag: string,
  index: number
): string {
  if (arg.startsWith(`${flag}=`)) {
    return arg.slice(flag.length + 1)
  }

  const value = argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Missing value for ${flag}`)
  }

  return value
}

function printUsage(exitCode: number): never {
  const usage = [
    'Usage: node out/postie-mcp.js [--print-config | --serve] [options]',
    '',
    'Options:',
    '  --print-config                 Print MCP JSON config to stdout.',
    '  --serve                        Start the MCP server.',
    '  --storage-path <path>          Explicit Postie storage path.',
    '  --compatibility-clients <csv>  Override compatibility client list.',
    '  --screenshot-presets <csv>     Override screenshot preset list.',
    '  -h, --help                     Show help.',
  ].join('\n')

  console.log(usage)
  process.exit(exitCode)
}

function getVersion(): string {
  try {
    const pkg = require(path.join(__dirname, '..', 'package.json'))
    return pkg.version || '1.0.0'
  } catch {
    return '1.0.0'
  }
}

function resolveStoragePath(explicitPath?: string): string {
  if (explicitPath) {
    return explicitPath
  }

  return resolvePostieStoragePath()
}

function buildConfig(storagePath: string, options: CliOptions) {
  const mcpServerPath = path.resolve(__dirname, 'mcpServer.js')
  return buildMcpConfig({
    mcpServerPath,
    storagePath,
    version: getVersion(),
    compatibilityClients: options.compatibilityClients,
    screenshotPresets: options.screenshotPresets,
  })
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  if (options.printConfig && options.serve) {
    throw new Error('Use either --print-config or --serve, not both.')
  }

  if (!options.printConfig && !options.serve) {
    printUsage(1)
  }

  const storagePath = resolveStoragePath(options.storagePath)
  const { json, config } = buildConfig(storagePath, options)

  if (options.printConfig) {
    console.log(json)
    return
  }

  if (!options.serve) {
    return
  }

  const env = {
    ...process.env,
    ...((config as { mcpServers?: any }).mcpServers?.postie?.env ?? {}),
  }

  const mcpServerPath = path.resolve(__dirname, 'mcpServer.js')
  const child = spawn(process.execPath, [mcpServerPath], {
    stdio: 'inherit',
    env,
  })

  child.on('exit', (code) => {
    process.exit(code ?? 0)
  })
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(message)
  process.exit(1)
})
