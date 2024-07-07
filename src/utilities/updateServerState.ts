import { commands } from 'vscode'

export function updateServerState(running: boolean): void {
  commands.executeCommand('setContext', 'postie.isRunning', running)
}
