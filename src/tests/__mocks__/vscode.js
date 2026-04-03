const EventEmitter = jest.fn(() => ({
  event: jest.fn(),
  fire: jest.fn(),
  dispose: jest.fn(),
}))

const languages = {
  createDiagnosticCollection: jest.fn(),
}

const StatusBarAlignment = {}

const window = {
  createStatusBarItem: jest.fn(() => ({
    show: jest.fn(),
  })),
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
  createTextEditorDecorationType: jest.fn(),
}

const workspace = {
  getConfiguration: jest.fn(),
  workspaceFolders: [],
  onDidSaveTextDocument: jest.fn(),
}

const OverviewRulerLane = {
  Left: null,
}

const Uri = {
  file: (f) => f,
  parse: jest.fn(),
}
const Range = jest.fn()
const Diagnostic = jest.fn()
const DiagnosticSeverity = { Error: 0, Warning: 1, Information: 2, Hint: 3 }

const debug = {
  onDidTerminateDebugSession: jest.fn(),
  startDebugging: jest.fn(),
}

const commands = {
  executeCommand: jest.fn(),
}

const l10n = {
  t: (messageOrOptions, ...args) => {
    const options =
      typeof messageOrOptions === 'string'
        ? { message: messageOrOptions, args }
        : messageOrOptions

    const values = options.args ?? args
    if (Array.isArray(values)) {
      return options.message.replace(
        /\{(\d+)\}/g,
        (_, idx) => String(values[Number(idx)] ?? '')
      )
    }

    return options.message.replace(
      /\{([^}]+)\}/g,
      (_, key) => String(values[key] ?? '')
    )
  },
}

const vscode = {
  EventEmitter,
  languages,
  StatusBarAlignment,
  window,
  workspace,
  OverviewRulerLane,
  Uri,
  Range,
  Diagnostic,
  DiagnosticSeverity,
  debug,
  commands,
  l10n,
}

module.exports = vscode
