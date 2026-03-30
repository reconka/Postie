import React from 'react'
import { VscodeBadge } from './uiElements'
import type { TabId } from '../tabs'

type TabButtonProps = {
  id: TabId
  activeTab: TabId
  label: string
  onClick: (id: TabId) => void
  badgeCount?: number
}

export function TabButton({
  id,
  activeTab,
  label,
  onClick,
  badgeCount,
}: TabButtonProps) {
  const isActive = activeTab === id
  return (
    <button
      className={`postie-tab${isActive ? ' active' : ''}`}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => onClick(id)}
      type="button"
    >
      {label}
      {badgeCount ? (
        <VscodeBadge className="postie-badge">{badgeCount}</VscodeBadge>
      ) : null}
    </button>
  )
}
