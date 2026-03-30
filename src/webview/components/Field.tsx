import React, { useId } from 'react'
import { VscodeLabel, VscodeTextfield } from './uiElements'

type FieldProps = {
  icon: string
  label: string
  value: string
}

export function Field({ icon, label, value }: FieldProps) {
  const inputId = useId()

  return (
    <div className="postie-field full-width">
      <VscodeLabel
        className="postie-field-label"
        htmlFor={inputId}
        title={label}
      >
        <span className={`codicon codicon-${icon}`} aria-hidden="true"></span>
        {label}:
      </VscodeLabel>
      <VscodeTextfield
        id={inputId}
        className="postie-field-input"
        readonly
        value={value}
      />
    </div>
  )
}
