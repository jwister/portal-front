import type { PortalLanguage } from '../../../i18n'

/**
 * Tool and skill write-ups live in per-article modules instead of the locale tables:
 * the tables load on every page, these only on the article that shows them. Each
 * module carries both languages so a tool's facts and its prose stay in one place.
 */
export type Text = string | Record<PortalLanguage, string>

/** One tab of a code block. `{baseUrl}` and `{host}` are filled with the live ZToken endpoints. */
export interface Snippet { label: Text; value: string }

export interface Entry {
  /** Section anchor, so keep it stable once published. */
  id: string
  name: Text
  summary: Text
  homepage?: string
  github?: string
  /** Which ZToken address the tool takes: OpenAI-style `/v1`, or the bare host for Anthropic and Google. */
  protocol?: 'openai' | 'anthropic' | 'google'
  /** The address to enter when it is not the protocol's default, e.g. for a client that appends `/v1` itself. */
  url?: string
  /** GitHub stars when the list was last checked; see the module's `updated`. */
  stars?: number
  install?: Snippet[]
  steps?: Text[]
  config?: Snippet[]
  note?: Text
}

export interface EcosystemModule {
  /** ISO date the entries were last checked against the projects' own docs. */
  updated: string
  /** The article's lead paragraph; kept here with the entries rather than in the locale tables. */
  intro: Text
  entries: Entry[]
}
