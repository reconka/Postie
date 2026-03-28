export const SUPPORTED_COMPATIBILITY_CLIENTS = [
  'apple-mail.macos',
  'apple-mail.ios',
  'gmail.desktop-webmail',
  'gmail.ios',
  'gmail.android',
  'gmail.mobile-webmail',
  'orange.desktop-webmail',
  'orange.ios',
  'orange.android',
  'outlook.windows',
  'outlook.windows-mail',
  'outlook.macos',
  'outlook.ios',
  'outlook.android',
  'yahoo.desktop-webmail',
  'yahoo.ios',
  'yahoo.android',
  'aol.desktop-webmail',
  'aol.ios',
  'aol.android',
  'samsung-email.android',
  'sfr.desktop-webmail',
  'sfr.ios',
  'sfr.android',
  'thunderbird.macos',
  'protonmail.desktop-webmail',
  'protonmail.ios',
  'protonmail.android',
  'hey.desktop-webmail',
  'mail-ru.desktop-webmail',
  'fastmail.desktop-webmail',
  'laposte.desktop-webmail',
]

export const DEFAULT_COMPATIBILITY_CLIENTS = [
  'apple-mail.ios',
  'gmail.ios',
  'gmail.android',
  'outlook.windows',
]

export function normalizeCompatibilityClients(input: string[]): string[] {
  const normalized = input
    .map((value) => value.trim())
    .filter((value) => value.length > 0)

  return [...new Set(normalized)]
}

export function getInvalidCompatibilityClients(input: string[]): string[] {
  const supported = new Set(SUPPORTED_COMPATIBILITY_CLIENTS)
  return normalizeCompatibilityClients(input).filter(
    (client) => !supported.has(client)
  )
}
