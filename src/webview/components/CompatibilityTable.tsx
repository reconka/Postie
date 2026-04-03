import React from 'react'
import type { CompatibilityRow, WebviewStrings } from '../../types/WebviewContracts'
import {
  VscodeTable,
  VscodeTableHeader,
  VscodeTableHeaderCell,
  VscodeTableBody,
  VscodeTableRow,
  VscodeTableCell,
} from './uiElements'

type CompatibilityTableProps = {
  rows: CompatibilityRow[]
  strings: WebviewStrings
}

export function CompatibilityTable({ rows, strings }: CompatibilityTableProps) {
  return (
    <VscodeTable className="postie-table" aria-label={strings.compatibilityTableAriaLabel}>
      <VscodeTableHeader>
        <VscodeTableRow>
          <VscodeTableHeaderCell>{strings.compatibilityReportTypeHeader}</VscodeTableHeaderCell>
          <VscodeTableHeaderCell>{strings.compatibilityResultHeader}</VscodeTableHeaderCell>
          <VscodeTableHeaderCell>{strings.compatibilityClientHeader}</VscodeTableHeaderCell>
        </VscodeTableRow>
      </VscodeTableHeader>
      <VscodeTableBody>
        {rows.map((row, index) => (
          <VscodeTableRow key={`${row.ReportType}-${row.Client}-${index}`}>
            <VscodeTableCell>{row.ReportType ?? ''}</VscodeTableCell>
            <VscodeTableCell>{row.Result ?? ''}</VscodeTableCell>
            <VscodeTableCell>{row.Client ?? ''}</VscodeTableCell>
          </VscodeTableRow>
        ))}
      </VscodeTableBody>
    </VscodeTable>
  )
}
