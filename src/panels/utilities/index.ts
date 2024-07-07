/*
 * This file contains utility functions that are used across the panels.
 */

import { Attachment } from '../../types/Email'

export function createTextField(
  icon: string,
  label: string,
  value: string
): string {
  return `<vscode-text-field class="full-width" readonly value="${value}">
            <span slot="start" class="codicon ${icon}"></span>${label}:
          </vscode-text-field>`
}

export function createAttachmentButton(attachment: Attachment[]): string {
  return attachment
    .map(
      (attachment) => `
    <vscode-button appearance="secondary" title="Download attachment" id="${attachment.fileName}">
      <span slot="start" class="codicon codicon-file-binary"></span> ${attachment.fileName}
    </vscode-button>
  `
    )
    .join('')
}

export function convertStringToBase64DataUrl(
  content: string,
  mimeType: string = 'text/html'
): string {
  const base64Content = Buffer.from(content).toString('base64')
  return `data:${mimeType};base64,${base64Content}`
}
