import type { Entry, Text } from './types'

export const updated = '2026-10-12'

export const intro: Text = {
  en: 'Install the terminal coding agents developers use most, then point each one at ZToken.',
  'zh-CN': '安装开发者最常用的终端编程 Agent，并逐个接入 ZToken。',
}

export const entries: Entry[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    summary: {
      en: 'Anthropic\'s coding agent for the terminal. It reads your codebase, edits files and runs commands, and connects to ZToken over the Anthropic Messages protocol.',
      'zh-CN': 'Anthropic 出品的终端编程 Agent，能读懂代码库、修改文件并执行命令，通过 Anthropic Messages 协议接入 ZToken。',
    },
    homepage: 'https://code.claude.com/docs',
    github: 'https://github.com/anthropics/claude-code',
    install: [
      { label: 'macOS / Linux', value: 'curl -fsSL https://claude.ai/install.sh | bash' },
      { label: 'Windows PowerShell', value: 'irm https://claude.ai/install.ps1 | iex' },
      { label: 'npm', value: 'npm install -g @anthropic-ai/claude-code' },
    ],
    protocol: 'anthropic',
    steps: [
      { en: 'Set the address and key as environment variables, or put them in the env block of ~/.claude/settings.json so they persist.', 'zh-CN': '把地址与密钥写入环境变量；想长期生效可写进 ~/.claude/settings.json 的 env 字段。' },
      { en: 'Run claude, then switch models with /model using a name copied from the model catalog.', 'zh-CN': '执行 claude 启动，用 /model 切换模型，模型名从模型广场复制。' },
    ],
    config: [
      { label: 'macOS / Linux', value: 'export ANTHROPIC_BASE_URL="{host}"\nexport ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"\nclaude' },
      { label: 'Windows PowerShell', value: '$env:ANTHROPIC_BASE_URL="{host}"\n$env:ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"\nclaude' },
      { label: '~/.claude/settings.json', value: '{\n  "env": {\n    "ANTHROPIC_BASE_URL": "{host}",\n    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY"\n  }\n}' },
    ],
    note: {
      en: 'The address has no /v1. Put the variables in your shell or the user-level settings file: a project\'s .claude/settings.json alone still shows the login screen. If requests fail with 400 about unknown fields, also set CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1.',
      'zh-CN': '地址不带 /v1。变量要写在终端环境或用户级 settings.json 中，只写在项目的 .claude/settings.json 里仍会弹出登录页。若请求报 400 并提示未知字段，再设置 CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1。',
    },
  },
  {
    id: 'codex-cli',
    name: 'Codex CLI',
    summary: {
      en: 'OpenAI\'s open-source coding agent for the terminal. It talks to ZToken through the OpenAI Responses API.',
      'zh-CN': 'OpenAI 开源的终端编程 Agent，通过 OpenAI Responses 接口接入 ZToken。',
    },
    github: 'https://github.com/openai/codex',
    install: [
      { label: 'macOS / Linux', value: 'curl -fsSL https://chatgpt.com/codex/install.sh | sh' },
      { label: 'Windows', value: 'powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"' },
      { label: 'npm', value: 'npm install -g @openai/codex' },
    ],
    protocol: 'openai',
    steps: [
      { en: 'Add ZToken as a provider in ~/.codex/config.toml.', 'zh-CN': '在 ~/.codex/config.toml 中添加 ZToken 服务商。' },
      { en: 'Put your key in the ZTOKEN_API_KEY environment variable, then run codex.', 'zh-CN': '把密钥写入环境变量 ZTOKEN_API_KEY，然后运行 codex。' },
    ],
    config: [
      { label: '~/.codex/config.toml', value: 'model = "YOUR_MODEL"\nmodel_provider = "ztoken"\n\n[model_providers.ztoken]\nname = "ZToken"\nbase_url = "{baseUrl}"\nenv_key = "ZTOKEN_API_KEY"\nwire_api = "responses"' },
      { label: 'macOS / Linux', value: 'export ZTOKEN_API_KEY="YOUR_API_KEY"\ncodex' },
      { label: 'Windows PowerShell', value: '$env:ZTOKEN_API_KEY="YOUR_API_KEY"\ncodex' },
    ],
    note: {
      en: 'Current Codex releases only speak the Responses API (/v1/responses), so pick a model that supports it. Providers must be set in the config.toml in your home folder; a project\'s .codex/config.toml cannot add one.',
      'zh-CN': '新版 Codex 只使用 Responses 接口（/v1/responses），请选择支持该接口的模型。服务商只能写在用户目录的 config.toml 中，项目内的 .codex/config.toml 不能添加服务商。',
    },
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    summary: {
      en: 'Google\'s open-source agent for the terminal. Point its Gemini API base URL at ZToken to use Gemini models.',
      'zh-CN': 'Google 开源的终端 Agent，把 Gemini API 地址指向 ZToken 即可调用 Gemini 模型。',
    },
    homepage: 'https://geminicli.com',
    github: 'https://github.com/google-gemini/gemini-cli',
    install: [
      { label: 'npm', value: 'npm install -g @google/gemini-cli' },
      { label: 'Homebrew', value: 'brew install gemini-cli' },
    ],
    protocol: 'google',
    steps: [
      { en: 'Set the two environment variables below; they can also go in ~/.gemini/.env.', 'zh-CN': '设置下面两个环境变量，也可以写进 ~/.gemini/.env。' },
      { en: 'Run gemini and choose "Use Gemini API key" when asked how to sign in.', 'zh-CN': '运行 gemini，登录方式选择 Use Gemini API key。' },
    ],
    config: [
      { label: 'macOS / Linux', value: 'export GOOGLE_GEMINI_BASE_URL="{host}"\nexport GEMINI_API_KEY="YOUR_API_KEY"\ngemini' },
      { label: 'Windows PowerShell', value: '$env:GOOGLE_GEMINI_BASE_URL="{host}"\n$env:GEMINI_API_KEY="YOUR_API_KEY"\ngemini' },
    ],
    note: {
      en: 'The address has no /v1. Use a Gemini model that the catalog lists with the Google protocol; a misspelled model name can leave the CLI waiting with no reply.',
      'zh-CN': '地址不带 /v1。请使用模型广场中支持 Google 协议的 Gemini 模型；模型名写错时 CLI 可能一直等待无响应。',
    },
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    summary: {
      en: 'An open-source coding agent for the terminal that works with any OpenAI-compatible provider.',
      'zh-CN': '开源的终端编程 Agent，可接入任意 OpenAI 兼容服务商。',
    },
    homepage: 'https://opencode.ai',
    github: 'https://github.com/anomalyco/opencode',
    install: [
      { label: 'macOS / Linux', value: 'curl -fsSL https://opencode.ai/install | bash' },
      { label: 'npm', value: 'npm install -g opencode-ai@latest' },
    ],
    protocol: 'openai',
    steps: [
      { en: 'Add ZToken as a provider in ~/.config/opencode/opencode.json, or in opencode.json at the project root, with model names copied from the catalog.', 'zh-CN': '在 ~/.config/opencode/opencode.json（或项目根目录的 opencode.json）中添加 ZToken 服务商，模型名从模型广场复制。' },
      { en: 'Set ZTOKEN_API_KEY, run opencode and pick the model with /models.', 'zh-CN': '设置环境变量 ZTOKEN_API_KEY 后运行 opencode，用 /models 选择模型。' },
    ],
    config: [
      { label: 'opencode.json', value: '{\n  "provider": {\n    "ztoken": {\n      "npm": "@ai-sdk/openai-compatible",\n      "name": "ZToken",\n      "options": {\n        "baseURL": "{baseUrl}",\n        "apiKey": "{env:ZTOKEN_API_KEY}"\n      },\n      "models": {\n        "YOUR_MODEL": { "name": "YOUR_MODEL" }\n      }\n    }\n  }\n}' },
    ],
    note: {
      en: 'For models served through the Responses API, change "npm" to "@ai-sdk/openai".',
      'zh-CN': '使用走 Responses 接口的模型时，把 "npm" 改为 "@ai-sdk/openai"。',
    },
  },
  {
    id: 'qwen-code',
    name: 'Qwen Code',
    summary: {
      en: 'An open-source coding agent for the terminal from the Qwen team. It accepts either an OpenAI-compatible or an Anthropic-compatible provider.',
      'zh-CN': '通义千问团队开源的终端编程 Agent，可接入 OpenAI 兼容或 Anthropic 兼容服务商。',
    },
    homepage: 'https://qwenlm.github.io/qwen-code-docs/en/users/overview',
    github: 'https://github.com/QwenLM/qwen-code',
    install: [
      { label: 'npm', value: 'npm install -g @qwen-code/qwen-code@latest' },
      { label: 'Homebrew', value: 'brew install qwen-code' },
    ],
    protocol: 'openai',
    steps: [
      { en: 'Set the address, key and model as environment variables, then run qwen.', 'zh-CN': '用环境变量设置地址、密钥与模型，然后运行 qwen。' },
    ],
    config: [
      { label: 'macOS / Linux', value: 'export OPENAI_BASE_URL="{baseUrl}"\nexport OPENAI_API_KEY="YOUR_API_KEY"\nexport OPENAI_MODEL="YOUR_MODEL"\nqwen' },
      { label: 'Windows PowerShell', value: '$env:OPENAI_BASE_URL="{baseUrl}"\n$env:OPENAI_API_KEY="YOUR_API_KEY"\n$env:OPENAI_MODEL="YOUR_MODEL"\nqwen' },
    ],
    note: {
      en: 'To use the Anthropic protocol instead, set ANTHROPIC_BASE_URL to {host} (no /v1), with ANTHROPIC_API_KEY and ANTHROPIC_MODEL.',
      'zh-CN': '改用 Anthropic 协议时，设置 ANTHROPIC_BASE_URL 为 {host}（不带 /v1），并设置 ANTHROPIC_API_KEY 与 ANTHROPIC_MODEL。',
    },
  },
  {
    id: 'aider',
    name: 'Aider',
    summary: {
      en: 'An AI pair programmer for the terminal that edits files in your git repository and commits each change.',
      'zh-CN': '终端里的 AI 结对编程工具，直接修改 Git 仓库中的文件并为每次改动生成提交。',
    },
    homepage: 'https://aider.chat',
    github: 'https://github.com/Aider-AI/aider',
    install: [
      { label: 'macOS / Linux', value: 'curl -LsSf https://aider.chat/install.sh | sh' },
      { label: 'Windows', value: 'powershell -ExecutionPolicy ByPass -c "irm https://aider.chat/install.ps1 | iex"' },
      { label: 'pip', value: 'python -m pip install aider-install\naider-install' },
    ],
    protocol: 'openai',
    config: [
      { label: 'macOS / Linux', value: 'export OPENAI_API_BASE="{baseUrl}"\nexport OPENAI_API_KEY="YOUR_API_KEY"\naider --model openai/YOUR_MODEL' },
      { label: 'Windows', value: 'setx OPENAI_API_BASE "{baseUrl}"\nsetx OPENAI_API_KEY "YOUR_API_KEY"\n# Open a new terminal, then:\naider --model openai/YOUR_MODEL' },
    ],
    note: {
      en: 'Prefix the model name with openai/. On Windows, variables set with setx only apply to terminals opened afterwards.',
      'zh-CN': '模型名前要加 openai/ 前缀。Windows 用 setx 设置的变量只对之后新开的终端生效。',
    },
  },
  {
    id: 'cc-switch',
    name: 'CC Switch',
    summary: {
      en: 'A desktop app for switching the API provider of Claude Code, Codex, Gemini CLI, OpenCode and more without editing their config files by hand. It also manages MCP servers and skills across those tools.',
      'zh-CN': '桌面端供应商管理工具，一键切换 Claude Code、Codex、Gemini CLI、OpenCode 等工具的 API 供应商，不用手改配置文件，还能统一管理 MCP 与 Skill。',
    },
    homepage: 'https://ccswitch.io',
    github: 'https://github.com/farion1231/cc-switch',
    install: [
      { label: 'macOS', value: 'brew install --cask cc-switch' },
    ],
    steps: [
      { en: 'Select the tool in the sidebar, click + (Add provider) at the top right and choose a custom configuration.', 'zh-CN': '在侧栏选中要配置的工具，点击右上角「+」添加供应商，选择自定义配置。' },
      { en: 'Enter {host} for Claude Code or {baseUrl} for Codex, plus your API key.', 'zh-CN': 'Claude Code 填 {host}，Codex 填 {baseUrl}，再填入 API Key。' },
      { en: 'Click Enable. Claude Code picks it up immediately; restart the terminal for Codex and Gemini CLI.', 'zh-CN': '点击「启用」。Claude Code 立即生效，Codex 与 Gemini CLI 需重启终端。' },
    ],
    note: {
      en: 'On Windows and Linux, download the installer (.msi, AppImage and others) from the project\'s GitHub Releases page.',
      'zh-CN': 'Windows 与 Linux 请从项目 GitHub Releases 页面下载安装包（.msi、AppImage 等）。',
    },
  },
]
