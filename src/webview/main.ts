import {
  provideVSCodeDesignSystem,
  allComponents,
} from '@vscode/webview-ui-toolkit'

provideVSCodeDesignSystem().register(allComponents)

const vscode = acquireVsCodeApi()
window.addEventListener('load', main)

function main() {
  document
    .getElementById('show-more')
    ?.addEventListener('click', showHideElement)
  document.getElementById('open-eml')?.addEventListener('click', downloadEmail)
  document
    .getElementById('open-source')
    ?.addEventListener('click', openSourceCode)

  function showHideElement() {
    const detailedInformation = document.querySelector('#more-info')
    if (detailedInformation) {
      detailedInformation.classList.toggle('hidden')
        ? (this.textContent = 'Show More')
        : (this.textContent = 'Show Less')
    }
  }

  function openSourceCode() {
    vscode.postMessage({
      command: 'open-source',
    })
  }

  function downloadEmail() {
    vscode.postMessage({
      command: 'download-eml',
    })
  }
}