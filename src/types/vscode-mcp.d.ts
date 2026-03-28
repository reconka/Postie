declare module 'vscode' {
  export class McpStdioServerDefinition {
    cwd?: Uri
    command: string
    args: string[]
    env: Record<string, string | number | null>
    version?: string
    constructor(
      label: string,
      command: string,
      args?: string[],
      env?: Record<string, string | number | null>,
      version?: string
    )
  }

  export interface McpServerDefinitionProvider {
    onDidChangeMcpServerDefinitions?: Event<void>
    provideMcpServerDefinitions(token: CancellationToken): Thenable<unknown[]>
    resolveMcpServerDefinition(
      server: unknown,
      token: CancellationToken
    ): Thenable<unknown | undefined>
  }

  export namespace lm {
    function registerMcpServerDefinitionProvider(
      providerId: string,
      provider: McpServerDefinitionProvider
    ): Disposable
  }
}
