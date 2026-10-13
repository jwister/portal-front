import { describe, expect, it } from 'vitest'
import * as cli from './cli-tools'
import * as ide from './ide-tools'
import * as clients from './chat-clients'
import * as skills from './agent-skills'
import type { Text } from './types'

const modules = { cli, ide, clients, skills }

/** Every translatable field of an entry, so a missing language is caught when a tool is added. */
function texts(value: unknown): Text[] {
  if (Array.isArray(value)) return value.flatMap(texts)
  if (value && typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 2 && keys.includes('en') && keys.includes('zh-CN')) return [value as Text]
    return Object.values(value).flatMap(texts)
  }
  return []
}

describe.each(Object.entries(modules))('%s entries', (_, { updated, intro, entries }) => {
  it('have a check date, unique anchors and both languages', () => {
    expect(updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(entries.length).toBeGreaterThan(0)
    const ids = entries.map((entry) => entry.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    expect(typeof intro).toBe('object')
    for (const text of texts([intro, entries])) {
      if (typeof text === 'string') continue
      expect(text.en.trim()).not.toBe('')
      expect(text['zh-CN'].trim()).not.toBe('')
    }
  })
  it('link over https and leave the ZToken address to the page', () => {
    for (const entry of entries) {
      for (const url of [entry.homepage, entry.github]) if (url) expect(url).toMatch(/^https:\/\//)
      // The deployment can serve a different API host, so snippets use {baseUrl} / {host}.
      expect(JSON.stringify(entry)).not.toContain('api.ztoken.cc')
      if (entry.url) expect(entry.protocol).toBeDefined()
    }
  })
})

it('lists skills by stars, highest first', () => {
  const stars = skills.entries.filter((entry) => entry.stars !== undefined).map((entry) => entry.stars!)
  expect(stars).toHaveLength(5)
  expect(stars).toEqual([...stars].sort((a, b) => b - a))
})
