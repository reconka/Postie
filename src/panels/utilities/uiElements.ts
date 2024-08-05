import { Attachment } from '../../types/Email'
import { sanitize } from '../../utilities/formatters'

export function createTextField(
  icon: string,
  label: string,
  value: string
): string {
  return `<vscode-text-field class="full-width" readonly value="${sanitize(
    value
  )}">
            <span slot="start" class="codicon ${icon}"></span>${sanitize(
    label
  )}:
          </vscode-text-field>`
}

export function createAttachmentButtons(attachment: Attachment[]): string {
  return attachment
    .map(
      (attachment) => `
    <vscode-button appearance="secondary" class="open-attachment" title="Open attachment" data-attachment="${attachment.fileUrl?.path}">
      <span slot="start" class="codicon codicon-file-binary"></span> ${attachment.fileName}
    </vscode-button>
  `
    )
    .join('')
}
