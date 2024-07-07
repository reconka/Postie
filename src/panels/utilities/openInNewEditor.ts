import { Position, Uri, window, workspace, commands } from 'vscode'

/**
 * Opens a new editor with the given file name and content.
 *
 * @param editorName The name of the editor to open.
 * @param content The content of the file to open, or a Uri to open.
 */
export async function openInNewEditor(
  editorName: string,
  content: string | Uri
) {
  if (content instanceof Uri) {
    commands.executeCommand('vscode.open', content)
    return
  }

  const untitledFile = Uri.parse(`untitled:${editorName}`)
  const document = await workspace.openTextDocument(
    untitledFile.with({
      scheme: 'untitled',
      path: untitledFile.path,
    })
  )
  const textEditor = await window.showTextDocument(document, {
    preview: false,
  })
  await textEditor.edit(
    (edit: { insert: (arg0: Position, arg1: string) => void }) => {
      edit.insert(new Position(0, 0), content)
    }
  )
}
