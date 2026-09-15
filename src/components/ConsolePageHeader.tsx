import type { ReactNode } from 'react'

interface ConsolePageHeaderProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function ConsolePageHeader({ title, description, actions }: ConsolePageHeaderProps) {
  return (
    <header className="console-page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="console-page-header-actions">{actions}</div>}
    </header>
  )
}
