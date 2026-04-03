# Contribute

Feel free to open issues or PRs!

## Running extension

- Open this repository inside your Visual Studio Code
- `npm install`
- Debug sidebar
- `Run Postie Extension`

## Localization workflow

- Keep `package.nls.json` as the English source for manifest (`package.json`) contribution strings.
- Use `vscode.l10n.t(...)` for runtime/user-facing strings in extension code.
- After adding or changing runtime strings, regenerate the bundle with:
  - `npm run l10n:extract`
- Commit both localization artifacts:
  - `package.nls.json`
  - `l10n/bundle.l10n.json`
