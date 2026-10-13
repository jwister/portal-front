import type { Entry, Text } from './types'

export const updated = '2026-10-12'

export const intro: Text = {
  en: 'Skills teach a coding agent a repeatable way to do a task. These are the most-starred skill repositories on GitHub, and they work with any model you call through ZToken.',
  'zh-CN': 'Skill 教会编程 Agent 用固定的方法完成某类任务。下面是 GitHub 上 Star 最多的 Skill 仓库，通过 ZToken 调用任意模型时都能使用。',
}

/**
 * The five most-starred repositories whose main content is installable skills, highest
 * first. Curated lists, desktop apps and full agent harnesses are left out even when they
 * have more stars, because there is nothing in them to install as a skill.
 */
export const entries: Entry[] = [
  {
    id: 'install',
    name: { en: 'Installing a skill', 'zh-CN': '通用安装方式' },
    summary: {
      en: 'A skill is a folder holding a SKILL.md and optional scripts; the agent reads it when a task matches. Claude Code and Codex install skills as plugins. For any other agent, the open-source skills CLI copies a GitHub repository\'s skills into the right folder and asks which ones and which agent you want.',
      'zh-CN': 'Skill 是一个包含 SKILL.md 和可选脚本的文件夹，Agent 遇到匹配的任务时会自动读取。Claude Code 与 Codex 以插件形式安装 Skill；其他工具可以用开源的 skills 命令行，把 GitHub 仓库里的 Skill 复制到对应目录，安装时会询问要装哪些、装给哪个工具。',
    },
    homepage: 'https://skills.sh',
    github: 'https://github.com/vercel-labs/skills',
    install: [
      { label: { en: 'Any agent', 'zh-CN': '任意工具' }, value: 'npx skills@latest add <owner>/<repo>' },
      { label: 'Claude Code', value: 'npx skills@latest add <owner>/<repo> -a claude-code' },
      { label: { en: 'Update', 'zh-CN': '更新' }, value: 'npx skills@latest update' },
    ],
    note: {
      en: 'Skills can run scripts on your machine. Install only from the repositories listed below or ones you trust, and skim the SKILL.md first. Stars and install commands were checked against each project on 2026-10-12.',
      'zh-CN': 'Skill 可以在本机执行脚本，请只从下列仓库或你信任的来源安装，安装前先看一眼 SKILL.md。Star 数与安装命令核对于 2026-10-12。',
    },
  },
  {
    id: 'superpowers',
    name: 'Superpowers',
    summary: {
      en: 'A complete development methodology built from composable skills. The agent first questions you until the spec is clear, writes a step-by-step plan, then works through it with subagents under red/green TDD and reviews its own output. The skills trigger on their own.',
      'zh-CN': '由可组合 Skill 构成的完整开发方法论：Agent 先追问澄清需求，再写出分步实施计划，然后派子代理按红绿 TDD 逐项实现并自查。Skill 会自动触发，装上即可用。',
    },
    github: 'https://github.com/obra/superpowers',
    stars: 297_788,
    install: [
      { label: 'Claude Code', value: '/plugin install superpowers@claude-plugins-official' },
      { label: 'Codex CLI', value: '/plugins\n# Search for "superpowers", then choose Install Plugin' },
      { label: 'Cursor', value: '/add-plugin superpowers' },
    ],
    note: {
      en: 'The README covers more agents, including Gemini CLI, OpenCode and Qwen Code. Install it separately in each agent you use.',
      'zh-CN': 'Gemini CLI、OpenCode、Qwen Code 等更多工具的安装方式见仓库 README；同时用多个工具时需要分别安装。',
    },
  },
  {
    id: 'mattpocock-skills',
    name: 'Skills For Real Engineers',
    summary: {
      en: 'The engineering skills Matt Pocock uses every day: small, composable and model-agnostic. For example, /grill-me keeps asking questions until the requirements are pinned down.',
      'zh-CN': 'Matt Pocock 日常使用的工程类 Skill，小而可组合、不绑定模型。例如 /grill-me 会持续追问，直到把需求问清楚。',
    },
    github: 'https://github.com/mattpocock/skills',
    stars: 286_461,
    install: [
      { label: 'Claude Code', value: 'claude plugin install mattpocock-skills@claude-plugins-official' },
      { label: 'Codex', value: 'codex plugin marketplace add mattpocock/skills\ncodex plugin add mattpocock-skills@mattpocock' },
      { label: { en: 'Other agents', 'zh-CN': '其他工具' }, value: 'npx skills@latest add mattpocock/skills' },
    ],
    note: {
      en: 'After installing, run /setup-matt-pocock-skills once to choose your issue tracker and where docs are saved.',
      'zh-CN': '安装后先运行一次 /setup-matt-pocock-skills，设置使用的工单系统和文档保存位置。',
    },
  },
  {
    id: 'anthropic-skills',
    name: 'Anthropic Skills',
    summary: {
      en: 'Anthropic\'s official repository: the Word, PDF, PowerPoint and Excel skills behind Claude\'s file features, example skills for design, testing and MCP server development, and the Agent Skills spec with a template for writing your own.',
      'zh-CN': 'Anthropic 官方技能库：包含 Claude 文件能力背后的 Word、PDF、PPT、Excel 文档技能，设计、测试、MCP 服务开发等示例技能，以及 Agent Skills 规范和编写模板。',
    },
    github: 'https://github.com/anthropics/skills',
    stars: 180_545,
    install: [
      { label: 'Claude Code', value: '/plugin marketplace add anthropics/skills\n/plugin install document-skills@anthropic-agent-skills' },
      { label: { en: 'Other agents', 'zh-CN': '其他工具' }, value: 'npx skills@latest add anthropics/skills' },
    ],
    note: {
      en: 'The document skills are source-available rather than open source; most of the others are Apache 2.0.',
      'zh-CN': '文档类技能为源码可见（source-available）而非开源许可，其余多数为 Apache 2.0。',
    },
  },
  {
    id: 'ponytail',
    name: 'Ponytail',
    summary: {
      en: 'Makes the agent code like the laziest senior dev in the room. Before writing anything it asks whether the code needs to exist, then whether the codebase, the standard library or the platform already does it, and only then writes the minimum that works.',
      'zh-CN': '让 Agent 像「最懒的资深工程师」一样写代码：动手前依次确认这段代码是否真的需要、项目里是否已有、标准库或平台原生能力能否解决，最后才写最少可用的代码。',
    },
    github: 'https://github.com/DietrichGebert/ponytail',
    stars: 161_199,
    install: [
      { label: 'Claude Code', value: '/plugin marketplace add DietrichGebert/ponytail\n/plugin install ponytail@ponytail' },
      { label: 'Codex', value: 'codex plugin marketplace add DietrichGebert/ponytail\ncodex plugin add ponytail@ponytail' },
    ],
    note: {
      en: 'In Claude Code, send the two commands as separate messages. In Codex, open /hooks afterwards and trust its two hooks. Other agents can copy the repository\'s AGENTS.md into the project.',
      'zh-CN': 'Claude Code 中两条命令要分两次发送；Codex 安装后需打开 /hooks 信任它的两个钩子。其他工具可把仓库中的 AGENTS.md 复制到项目里。',
    },
  },
  {
    id: 'ui-ux-pro-max',
    name: 'UI UX Pro Max',
    summary: {
      en: 'A design knowledge skill: searchable UI styles, color palettes, font pairings and UX guidelines, so the agent has something concrete to work from when it builds an interface.',
      'zh-CN': 'UI/UX 设计知识库技能：内置可检索的界面风格、配色方案、字体搭配和 UX 准则，让 Agent 写前端页面时有据可依。',
    },
    homepage: 'https://uupm.cc',
    github: 'https://github.com/nextlevelbuilder/ui-ux-pro-max-skill',
    stars: 134_873,
    install: [
      { label: 'Claude Code', value: '/plugin marketplace add nextlevelbuilder/ui-ux-pro-max-skill\n/plugin install ui-ux-pro-max@ui-ux-pro-max-skill' },
      { label: { en: 'Other agents', 'zh-CN': '其他工具' }, value: 'npm install -g ui-ux-pro-max-cli\ncd /path/to/your/project\nuipro init --ai cursor   # or claude, windsurf, ...' },
    ],
    note: {
      en: 'The npm package is ui-ux-pro-max-cli and installs the uipro command; the older uipro-cli package is stale.',
      'zh-CN': 'npm 包名是 ui-ux-pro-max-cli，安装后提供 uipro 命令；旧的 uipro-cli 包已不再更新，不要使用。',
    },
  },
]
