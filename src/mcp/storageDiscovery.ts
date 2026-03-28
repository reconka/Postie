import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

export interface StorageDiscoveryOptions {
  roots?: string[]
}

export function listPostieStorageCandidates(
  options: StorageDiscoveryOptions = {}
): string[] {
  const roots = options.roots ?? getDefaultGlobalStorageRoots()
  return collectPostieStorageCandidates(roots)
}

export function resolvePostieStoragePath(
  options: StorageDiscoveryOptions = {}
): string {
  const candidates = listPostieStorageCandidates(options)

  if (candidates.length === 1) {
    return candidates[0]
  }

  if (candidates.length === 0) {
    throw new Error(
      'Unable to locate Postie storage. Pass --storage-path to set it explicitly.'
    )
  }

  throw new Error(
    `Multiple Postie storage folders found: ${candidates.join(
      ', '
    )}. Pass --storage-path to disambiguate.`
  )
}

function collectPostieStorageCandidates(roots: string[]): string[] {
  const directMatches: string[] = []
  const fallbackMatches: string[] = []

  for (const root of roots) {
    if (!root || !fs.existsSync(root)) {
      continue
    }

    const entries = safeReadDir(root)
    const entryNames =
      entries.length > 0 ? new Set(entries.map((entry) => entry.name)) : null

    const postiePublisherMatch = path.join(root, 'Postie.postie')
    const lowercaseMatch = path.join(root, 'postie.postie')

    const hasPostie =
      entryNames?.has('Postie.postie') ?? fs.existsSync(postiePublisherMatch)
    const hasLowercase =
      entryNames?.has('postie.postie') ?? fs.existsSync(lowercaseMatch)

    if (hasPostie) {
      directMatches.push(postiePublisherMatch)
    }

    if (hasLowercase) {
      directMatches.push(lowercaseMatch)
    }

    if (directMatches.length > 0) {
      continue
    }

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.endsWith('.postie')) {
        fallbackMatches.push(path.join(root, entry.name))
      }
    }
  }

  const uniqueDirect = dedupe(directMatches)
  if (uniqueDirect.length > 0) {
    return uniqueDirect
  }

  return dedupe(fallbackMatches)
}

function safeReadDir(root: string): fs.Dirent[] {
  try {
    return fs.readdirSync(root, { withFileTypes: true })
  } catch {
    return []
  }
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const item of items) {
    const key = getRealPathKey(item)
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    result.push(item)
  }

  return result
}

function getRealPathKey(targetPath: string): string {
  try {
    const realPath = fs.realpathSync(targetPath)
    if (process.platform === 'win32' || process.platform === 'darwin') {
      return realPath.toLowerCase()
    }
    return realPath
  } catch {
    if (process.platform === 'win32' || process.platform === 'darwin') {
      return targetPath.toLowerCase()
    }
    return targetPath
  }
}

function getDefaultGlobalStorageRoots(): string[] {
  const home = os.homedir()
  const appData = process.env.APPDATA || ''
  const localAppData = process.env.LOCALAPPDATA || ''
  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(home, '.config')

  return dedupe(
    [
      // macOS
      path.join(home, 'Library', 'Application Support', 'Code', 'User', 'globalStorage'),
      path.join(
        home,
        'Library',
        'Application Support',
        'Code - Insiders',
        'User',
        'globalStorage'
      ),
      path.join(
        home,
        'Library',
        'Application Support',
        'VSCodium',
        'User',
        'globalStorage'
      ),
      path.join(
        home,
        'Library',
        'Application Support',
        'Cursor',
        'User',
        'globalStorage'
      ),
      path.join(
        home,
        'Library',
        'Application Support',
        'Cursor - Insiders',
        'User',
        'globalStorage'
      ),
      // Linux
      path.join(xdgConfig, 'Code', 'User', 'globalStorage'),
      path.join(xdgConfig, 'Code - Insiders', 'User', 'globalStorage'),
      path.join(xdgConfig, 'VSCodium', 'User', 'globalStorage'),
      path.join(xdgConfig, 'Cursor', 'User', 'globalStorage'),
      path.join(xdgConfig, 'Cursor - Insiders', 'User', 'globalStorage'),
      // Windows
      path.join(appData, 'Code', 'User', 'globalStorage'),
      path.join(appData, 'Code - Insiders', 'User', 'globalStorage'),
      path.join(appData, 'VSCodium', 'User', 'globalStorage'),
      path.join(appData, 'Cursor', 'User', 'globalStorage'),
      path.join(appData, 'Cursor - Insiders', 'User', 'globalStorage'),
      path.join(localAppData, 'Code', 'User', 'globalStorage'),
      path.join(localAppData, 'Code - Insiders', 'User', 'globalStorage'),
      path.join(localAppData, 'VSCodium', 'User', 'globalStorage'),
      path.join(localAppData, 'Cursor', 'User', 'globalStorage'),
      path.join(localAppData, 'Cursor - Insiders', 'User', 'globalStorage'),
    ].filter(Boolean)
  )
}
