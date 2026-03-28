import { choosePostieStoragePath, StorageSelectionError } from '../../mcp/storageSelection'

describe('choosePostieStoragePath', () => {
  test('uses saved path when provided', async () => {
    await expect(
      choosePostieStoragePath({
        savedPath: '/tmp/saved',
        candidates: ['/tmp/a', '/tmp/b'],
      })
    ).resolves.toBe('/tmp/saved')
  })

  test('returns single candidate when no saved path', async () => {
    await expect(
      choosePostieStoragePath({
        candidates: ['/tmp/only'],
      })
    ).resolves.toBe('/tmp/only')
  })

  test('throws when no candidates', async () => {
    await expect(
      choosePostieStoragePath({
        candidates: [],
      })
    ).rejects.toMatchObject({ code: 'NO_CANDIDATES' })
  })

  test('throws when multiple candidates and no selector', async () => {
    await expect(
      choosePostieStoragePath({
        candidates: ['/tmp/a', '/tmp/b'],
      })
    ).rejects.toMatchObject({ code: 'MULTIPLE_CANDIDATES' })
  })

  test('throws when selector cancels', async () => {
    await expect(
      choosePostieStoragePath({
        candidates: ['/tmp/a', '/tmp/b'],
        select: async () => undefined,
      })
    ).rejects.toMatchObject({ code: 'CANCELLED' })
  })

  test('returns selected candidate when selector provides one', async () => {
    await expect(
      choosePostieStoragePath({
        candidates: ['/tmp/a', '/tmp/b'],
        select: async (paths) => paths[1],
      })
    ).resolves.toBe('/tmp/b')
  })
})
