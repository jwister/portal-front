// Read-only deployment check; never fetches authenticated or payment endpoints.
const origin = new URL(process.argv[2] ?? 'http://127.0.0.1:4173')
if (!['http:', 'https:'].includes(origin.protocol)) throw new Error('Expected an HTTP(S) origin')
const response = await fetch(origin, { signal: AbortSignal.timeout(20000) })
if (!response.ok) throw new Error(`Homepage returned ${response.status}`)
const html = await response.text()
const resources = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"<>]+)"/g)].map(match => match[1]))]
if (!resources.length) throw new Error('No fingerprinted assets found')
let failed = false
const htmlCache = response.headers.get('cache-control') ?? '(missing)'
if (!/no-cache|no-store|max-age=0\b/i.test(htmlCache)) failed = true
console.log(`HTML: Cache-Control=${htmlCache}`)
for (const resource of resources) {
  const result = await fetch(new URL(resource, origin), { method: 'HEAD', signal: AbortSignal.timeout(20000) })
  const cache = result.headers.get('cache-control') ?? '(missing)'
  const age = Number(cache.match(/max-age=(\d+)/i)?.[1] ?? 0)
  const pass = result.ok && /\bpublic\b/i.test(cache) && /\bimmutable\b/i.test(cache) && age >= 31536000
  console.log(`${pass ? 'PASS' : 'FAIL'} ${resource}: ${cache}`)
  if (!pass) failed = true
}
process.exitCode = failed ? 1 : 0
