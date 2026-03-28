export type StorageSelectionErrorCode =
  | 'NO_CANDIDATES'
  | 'MULTIPLE_CANDIDATES'
  | 'CANCELLED'

export class StorageSelectionError extends Error {
  constructor(
    public readonly code: StorageSelectionErrorCode,
    message: string
  ) {
    super(message)
  }
}

export interface StorageSelectionOptions {
  savedPath?: string
  candidates: string[]
  select?: (candidates: string[]) => Promise<string | undefined>
}

export async function choosePostieStoragePath(
  options: StorageSelectionOptions
): Promise<string> {
  if (options.savedPath) {
    return options.savedPath
  }

  if (options.candidates.length === 0) {
    throw new StorageSelectionError(
      'NO_CANDIDATES',
      'Unable to locate Postie storage. Pass --storage-path to set it explicitly.'
    )
  }

  if (options.candidates.length === 1) {
    return options.candidates[0]
  }

  if (!options.select) {
    throw new StorageSelectionError(
      'MULTIPLE_CANDIDATES',
      `Multiple Postie storage folders found: ${options.candidates.join(
        ', '
      )}. Pass --storage-path to disambiguate.`
    )
  }

  const selected = await options.select(options.candidates)
  if (!selected) {
    throw new StorageSelectionError(
      'CANCELLED',
      'Storage selection cancelled.'
    )
  }

  return selected
}
