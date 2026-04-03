import React, { useMemo, useState } from 'react'
import type {
  AppViewData,
  WebviewCommandMessage,
} from '../types/WebviewContracts'
import { WebviewCommand } from '../types/WebviewContracts'
import { type TabId, mapDefaultTab } from './tabs'
import { VscodeButton } from './components/uiElements'
import { Field } from './components/Field'
import { TabButton } from './components/TabButton'
import { Panel } from './components/Panel'
import { CompatibilityTable } from './components/CompatibilityTable'

type AppProps = {
  data: AppViewData
  vscode: {
    postMessage: (message: WebviewCommandMessage) => void
  }
}

export function App({ data, vscode }: AppProps) {
  const [showMore, setShowMore] = useState(false)
  const initialTab = mapDefaultTab(data.defaultTab)
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const [loadedTabs, setLoadedTabs] = useState<Set<TabId>>(
    () => new Set([initialTab]),
  )

  const errorCount = useMemo(
    () =>
      data.compatibilityRows.filter((row) => row.ReportType === 'errors')
        .length,
    [data.compatibilityRows],
  )

  const onOpenAttachment = (filePath: string | null) => {
    if (!filePath) {
      return
    }
    vscode.postMessage({
      command: WebviewCommand.OpenAttachment,
      fileUrl: filePath,
    })
  }

  const onTabChange = (tabId: TabId) => {
    setActiveTab(tabId)
    setLoadedTabs((prev) => {
      const next = new Set(prev)
      next.add(tabId)
      return next
    })
  }

  const onOpenSource = () =>
    vscode.postMessage({ command: WebviewCommand.OpenSource })
  const onOpenEml = () =>
    vscode.postMessage({ command: WebviewCommand.DownloadEml })
  const onCopyId = () =>
    vscode.postMessage({ command: WebviewCommand.CopyId })
  const attachmentsLabel =
    data.attachments.length === 1
      ? data.strings.attachmentsOneLabel
      : data.strings.attachmentsManyLabel

  return (
    <div className="postie-view">
      <Field icon="mail" label={data.strings.fromLabel} value={data.email.from} />
      <Field
        icon="book"
        label={data.strings.subjectLabel}
        value={data.email.subject}
      />
      <Field icon="account" label={data.strings.toLabel} value={data.email.to} />

      <div id="more-info" className={showMore ? '' : 'hidden'}>
        <Field icon="broadcast" label={data.strings.ccLabel} value={data.email.cc} />
        <Field icon="eye-closed" label={data.strings.bccLabel} value={data.email.bcc} />
        <Field
          icon="calendar"
          label={data.strings.dateLabel}
          value={new Date(data.email.receivedDateTime).toLocaleString()}
        />
        <p>{attachmentsLabel}:</p>
        <div className="postie-actions">
          {data.attachments.map((attachment) => (
            <VscodeButton
              key={attachment.id}
              secondary
              icon="file-binary"
              className="postie-button"
              onClick={() => onOpenAttachment(attachment.filePath)}
            >
              {attachment.fileName}
            </VscodeButton>
          ))}
        </div>
      </div>

      <div className="postie-actions m-top">
        <VscodeButton
          id="open-source"
          secondary
          icon="file-code"
          className="postie-button postie-button-secondary"
          onClick={onOpenSource}
        >
          {data.strings.sourceButtonLabel}
        </VscodeButton>
        <VscodeButton
          id="open-eml"
          secondary
          icon="telescope"
          className="postie-button postie-button-secondary"
          onClick={onOpenEml}
        >
          {data.strings.openEmlButtonLabel}
        </VscodeButton>
        <VscodeButton
          id="copy-id"
          secondary
          icon="copy"
          className="postie-button postie-button-secondary"
          onClick={onCopyId}
        >
          {data.strings.copyIdButtonLabel}
        </VscodeButton>
        <VscodeButton
          id="show-more"
          className="postie-button postie-button-primary"
          onClick={() => setShowMore((prev) => !prev)}
        >
          {showMore
            ? data.strings.showLessButtonLabel
            : data.strings.showMoreButtonLabel}
        </VscodeButton>
      </div>

      <hr className="m-top postie-divider" />

      <div
        className="postie-tabs"
        role="tablist"
        aria-label={data.strings.tabsAriaLabel}
      >
        <TabButton
          id="mobile"
          activeTab={activeTab}
          onClick={onTabChange}
          label={data.strings.mobileTabLabel}
        />
        <TabButton
          id="tablet"
          activeTab={activeTab}
          onClick={onTabChange}
          label={data.strings.tabletTabLabel}
        />
        <TabButton
          id="desktop"
          activeTab={activeTab}
          onClick={onTabChange}
          label={data.strings.desktopTabLabel}
        />
        <TabButton
          id="text-only"
          activeTab={activeTab}
          onClick={onTabChange}
          label={data.strings.textOnlyTabLabel}
        />
        <TabButton
          id="compatibility"
          activeTab={activeTab}
          onClick={onTabChange}
          label={data.strings.compatibilityTabLabel}
          badgeCount={errorCount}
        />
      </div>

      <Panel visible={activeTab === 'mobile'} id="view-mobile">
        <div className="container--mobile background--light">
          <iframe
            className="full-width full-height"
            src={loadedTabs.has('mobile') ? data.emailDataUrl : undefined}
          ></iframe>
        </div>
      </Panel>
      <Panel visible={activeTab === 'tablet'} id="view-tablet">
        <div className="container--tablet background--light">
          <iframe
            className="full-width full-height"
            src={loadedTabs.has('tablet') ? data.emailDataUrl : undefined}
            sandbox=""
          ></iframe>
        </div>
      </Panel>
      <Panel visible={activeTab === 'desktop'} id="view-desktop">
        <div className="container--desktop background--light">
          <iframe
            className="full-width full-height"
            src={loadedTabs.has('desktop') ? data.emailDataUrl : undefined}
          ></iframe>
        </div>
      </Panel>
      <Panel visible={activeTab === 'text-only'} id="view-text-only">
        <div>{data.email.text}</div>
      </Panel>
      <Panel visible={activeTab === 'compatibility'} id="view-compatibility">
        <CompatibilityTable rows={data.compatibilityRows} strings={data.strings} />
      </Panel>
    </div>
  )
}
