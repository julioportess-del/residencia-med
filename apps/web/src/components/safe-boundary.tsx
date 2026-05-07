'use client'

import { Component, type ReactNode } from 'react'

/**
 * Boundary leve que isola subseções da UI. Se quebrar, NÃO derruba a página
 * inteira — só mostra um placeholder discreto (ou nada).
 */
export class SafeBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; name?: string },
  { temErro: boolean }
> {
  override state = { temErro: false }

  static getDerivedStateFromError() {
    return { temErro: true }
  }

  override componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(
      `[safe-boundary${this.props.name ? ` :: ${this.props.name}` : ''}]`,
      error,
      info,
    )
  }

  override render() {
    if (this.state.temErro) return this.props.fallback ?? null
    return this.props.children
  }
}
