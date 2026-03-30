import React from 'react'

type PanelProps = {
  id: string
  visible: boolean
  children: React.ReactNode
}

export function Panel({ id, visible, children }: PanelProps) {
  return <div id={id} className={`postie-panel${visible ? '' : ' hidden'}`}>{children}</div>
}
