import { workspace } from 'vscode'
export interface Config {
  runServerOnStartup: boolean
  maxEmailSize: number
  smtpServerPort: number
  allowExternalMails: boolean
  compatibilityClients: string[]
  smtpUsername: string
  smtpPassword: string
  showNewEmailNotification: boolean
  maxStoredEmailsCount: number
  defaultEmailView: 'desktop' | 'tablet' | 'mobile' | 'text-only'
}

export function getConfig<K extends keyof Config>(key: K): Config[K] {
  return workspace.getConfiguration('postie').get(key) as Config[K]
}
