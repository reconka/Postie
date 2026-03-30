import React from 'react'
import type { CompatibilityRow } from '../../types/WebviewContracts'
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
}

export function CompatibilityTable({ rows }: CompatibilityTableProps) {
  return (
    <VscodeTable className="postie-table" aria-label="Compatibility result">
      <VscodeTableHeader>
        <VscodeTableRow>
          <VscodeTableHeaderCell>Report Type</VscodeTableHeaderCell>
          <VscodeTableHeaderCell>Result</VscodeTableHeaderCell>
          <VscodeTableHeaderCell>Client</VscodeTableHeaderCell>
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
