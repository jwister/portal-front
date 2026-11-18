/** 按顶层运算符拆分表达式；括号和 JSON 字符串内的符号不参与拆分。 */
function splitExpression(text: string, operator: string): string[] | null {
  const parts: string[] = []
  let depth = 0, quoted = false, escaped = false, start = 0
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') quoted = false
      continue
    }
    if (char === '"') quoted = true
    else if (char === '(') depth++
    else if (char === ')') { if (--depth < 0) return null }
    else if (depth === 0 && text.startsWith(operator, i)) {
      parts.push(text.slice(start, i).trim())
      i += operator.length - 1
      start = i + 1
    }
  }
  return quoted || depth !== 0 ? null : [...parts, text.slice(start).trim()]
}

/** 只移除完整包围表达式的括号，不改变条件分支或乘法的优先级。 */
function unwrap(text: string): string {
  let value = text.trim()
  while (value.startsWith('(') && value.endsWith(')') && splitExpression(value.slice(1, -1), '\0')) value = value.slice(1, -1).trim()
  return value
}

/** 仅解释白名单中的时间比较，不执行接口提供的代码或读取用户请求参数。 */
function matchesTimeCondition(condition: string, now: Date, depth = 0): boolean | null {
  if (depth > 24) return null
  const text = unwrap(condition)
  for (const operator of ['||', '&&']) {
    const parts = splitExpression(text, operator)
    if (!parts) return null
    if (parts.length > 1) {
      const results = parts.map((part) => matchesTimeCondition(part, now, depth + 1))
      if (results.includes(null)) return null
      return operator === '||' ? results.some(Boolean) : results.every(Boolean)
    }
  }
  if (text === 'true' || text === 'false') return text === 'true'
  if (text.startsWith('!') && !text.startsWith('!=')) {
    const result = matchesTimeCondition(text.slice(1), now, depth + 1)
    return result === null ? null : !result
  }
  const match = text.match(/^(hour|minute|weekday|month|day)\(\s*("(?:[^"\\]|\\.)*")\s*\)\s*(>=|<=|==|!=|>|<)\s*(-?\d+(?:\.\d+)?)$/)
  if (!match) return null
  try {
    const fields = new Intl.DateTimeFormat('en-US', {
      timeZone: JSON.parse(match[2]), hourCycle: 'h23', hour: 'numeric', minute: 'numeric',
      weekday: 'short', month: 'numeric', day: 'numeric',
    }).formatToParts(now)
    const values = Object.fromEntries(fields.map((field) => [field.type, field.value]))
    const value = match[1] === 'weekday'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(values.weekday)
      : Number(values[match[1]])
    const bound = Number(match[4])
    if (!Number.isFinite(value) || !Number.isFinite(bound)) return null
    switch (match[3]) {
      case '>=': return value >= bound
      case '<=': return value <= bound
      case '>': return value > bound
      case '<': return value < bound
      case '==': return value === bound
      case '!=': return value !== bound
    }
  } catch { /* 无效时区和日期无法确定价格，交回原始表达式展示。 */ }
  return null
}

/** 提取基础定价和时间规则乘积；任何未知因子都使整体回退，防止少算费用。 */
export function requestPricing(expression: string, now: Date): { expression: string; multiplier?: number } | null {
  const factors = splitExpression(unwrap(expression), '*')
  if (!factors) return null
  if (factors.length === 1) return { expression }
  // 未括起的三元条件可能仅在最后一个分支乘倍率，不能当作全模型折扣。
  if (splitExpression(factors[0], '?')?.length !== 1) return null
  let multiplier = 1
  for (const factor of factors.slice(1)) {
    const rule = unwrap(factor).match(/^([\s\S]+)\?\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\s*:\s*1(?:\.0*)?$/)
    if (!rule) return null
    const matches = matchesTimeCondition(rule[1], now)
    const value = Number(rule[2])
    if (matches === null || !Number.isFinite(value)) return null
    multiplier *= matches ? value : 1
    if (!Number.isFinite(multiplier)) return null
  }
  return { expression: unwrap(factors[0]), multiplier }
}
