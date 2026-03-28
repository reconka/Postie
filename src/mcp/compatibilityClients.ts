import {
  DEFAULT_COMPATIBILITY_CLIENTS,
  normalizeCompatibilityClients,
} from '../compatibility/clientsConfig'

export function readCompatibilityClientsFromEnv(
  rawValue: string | undefined
): string[] {
  if (!rawValue || rawValue.trim().length === 0) {
    return DEFAULT_COMPATIBILITY_CLIENTS
  }

  const parsed = normalizeCompatibilityClients(rawValue.split(','))
  return parsed.length > 0 ? parsed : DEFAULT_COMPATIBILITY_CLIENTS
}
