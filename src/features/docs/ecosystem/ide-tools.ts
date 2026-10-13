import type { Entry, Text } from './types'

export const updated = '2026-10-12'

export const intro: Text = {
  en: 'Editors and VS Code extensions that accept a custom model provider, with where each one keeps its base URL and key.',
  'zh-CN': '支持自定义模型服务商的编辑器与 VS Code 插件，以及各自填写地址和密钥的位置。',
}

export const entries: Entry[] = [
  {
    id: 'cursor',
    name: 'Cursor',
    summary: {
      en: 'An AI code editor built on VS Code. Download it from the website; its chat can use ZToken by overriding the OpenAI base URL.',
      'zh-CN': '基于 VS Code 的 AI 代码编辑器，从官网下载安装；通过覆盖 OpenAI 地址，对话功能即可使用 ZToken。',
    },
    homepage: 'https://cursor.com',
    protocol: 'openai',
    steps: [
      { en: 'Open Cursor Settings → Models → API Keys.', 'zh-CN': '打开 Cursor Settings → Models → API Keys。' },
      { en: 'Enter your key under OpenAI API Key, turn on Override OpenAI Base URL and enter {baseUrl}.', 'zh-CN': '在 OpenAI API Key 中填入密钥，打开 Override OpenAI Base URL 并填 {baseUrl}。' },
      { en: 'Add the model names you want, copied from the model catalog.', 'zh-CN': '添加要使用的模型名，模型名从模型广场复制。' },
    ],
    note: {
      en: 'Requests go through Cursor\'s servers. Custom models only power chat; Tab completion keeps using Cursor\'s own models. While the override is on, Cursor\'s built-in models may stop working, so turn it off to switch back.',
      'zh-CN': '请求会经由 Cursor 的服务器转发。自定义模型只用于对话，Tab 补全仍使用 Cursor 自带模型；开启地址覆盖后，内置模型可能无法使用，切回时关闭该开关即可。',
    },
  },
  {
    id: 'trae',
    name: 'Trae',
    summary: {
      en: 'ByteDance\'s AI IDE. Download it from the website, then add ZToken as a custom model in the OpenAI or Anthropic format.',
      'zh-CN': '字节跳动推出的 AI IDE，从官网下载安装后，可按 OpenAI 或 Anthropic 格式把 ZToken 添加为自定义模型。',
    },
    homepage: 'https://www.trae.ai',
    protocol: 'openai',
    steps: [
      { en: 'Open Settings → Models → Add Model → Custom Model.', 'zh-CN': '打开设置 → 模型 → 添加模型 → 自定义模型。' },
      { en: 'Choose the OpenAI Chat Completions format and enter {baseUrl} as the request URL with Full URL turned off. Alternatively, choose Anthropic Messages and enter {host}.', 'zh-CN': 'API 格式选 OpenAI Chat Completions，关闭「完整 URL」后请求地址填 {baseUrl}；也可以选 Anthropic Messages 并填 {host}。' },
      { en: 'Enter the model ID and your API key, then save.', 'zh-CN': '填入模型 ID 与 API Key 后保存。' },
    ],
    note: {
      en: 'Custom endpoints need a recent Trae release. If you don\'t see these options, update Trae first.',
      'zh-CN': '自定义地址需要较新版本的 Trae，看不到相应选项时请先升级。',
    },
  },
  {
    id: 'zed',
    name: 'Zed',
    summary: {
      en: 'A fast, open-source code editor with a built-in agent panel that accepts any OpenAI-compatible provider.',
      'zh-CN': '高性能开源代码编辑器，内置 Agent 面板，支持接入任意 OpenAI 兼容服务商。',
    },
    homepage: 'https://zed.dev',
    install: [
      { label: 'macOS', value: 'brew install --cask zed' },
      { label: 'Linux', value: 'curl -f https://zed.dev/install.sh | sh' },
      { label: 'Windows', value: 'winget install -e --id ZedIndustries.Zed' },
    ],
    protocol: 'openai',
    steps: [
      { en: 'Add ZToken as a provider in Zed\'s settings.json.', 'zh-CN': '在 Zed 的 settings.json 中添加 ZToken 服务商。' },
      { en: 'Enter the API key for ztoken in the agent panel settings, or set the ZTOKEN_API_KEY environment variable.', 'zh-CN': '在 Agent 面板设置中为 ztoken 填入 API Key，或设置环境变量 ZTOKEN_API_KEY。' },
    ],
    config: [
      { label: 'settings.json', value: '{\n  "language_models": {\n    "openai_compatible": {\n      "ztoken": {\n        "api_url": "{baseUrl}",\n        "available_models": [\n          { "name": "YOUR_MODEL", "max_tokens": 128000 }\n        ]\n      }\n    }\n  }\n}' },
    ],
    note: {
      en: 'Don\'t put the key in settings.json. For the Anthropic protocol, use "anthropic_compatible" with api_url set to {host}.',
      'zh-CN': '不要把密钥写进 settings.json。使用 Anthropic 协议时改用 "anthropic_compatible"，api_url 填 {host}。',
    },
  },
  {
    id: 'jetbrains-ai',
    name: 'JetBrains AI Assistant',
    summary: {
      en: 'The AI assistant built into IntelliJ IDEA, PyCharm, GoLand and the other JetBrains IDEs. With your own key it needs no JetBrains AI subscription.',
      'zh-CN': 'IntelliJ IDEA、PyCharm、GoLand 等 JetBrains IDE 内置的 AI 助手，使用自己的密钥时无需 JetBrains AI 订阅。',
    },
    homepage: 'https://www.jetbrains.com/help/ai-assistant/use-custom-models.html',
    protocol: 'openai',
    steps: [
      { en: 'Open Settings → Tools → AI Assistant → Providers & API keys.', 'zh-CN': '打开 Settings → Tools → AI Assistant → Providers & API keys。' },
      { en: 'Under third-party AI providers choose OpenAI-compatible, enter {baseUrl} as the URL and your API key, then click Test Connection.', 'zh-CN': '在第三方 AI 服务商中选择 OpenAI-compatible，URL 填 {baseUrl}，填入 API Key 后点击 Test Connection。' },
      { en: 'Under Models Assignment, assign ZToken models to chat and the other features.', 'zh-CN': '在 Models Assignment 中把对话等功能指定给 ZToken 的模型。' },
    ],
    note: {
      en: 'Inline code completion is configured separately and needs a model that supports fill-in-the-middle.',
      'zh-CN': '行内代码补全需要单独设置，并且要使用支持 FIM（中间填充）的模型。',
    },
  },
  {
    id: 'cline',
    name: 'Cline',
    summary: {
      en: 'An open-source coding agent for VS Code that plans, edits files and runs commands with your approval. It also ships as a CLI.',
      'zh-CN': '开源的 VS Code 编程 Agent，在你确认后规划任务、修改文件并执行命令，也提供命令行版本。',
    },
    homepage: 'https://cline.bot',
    github: 'https://github.com/cline/cline',
    install: [
      { label: 'VS Code', value: 'code --install-extension saoudrizwan.claude-dev' },
      { label: 'CLI', value: 'npm install -g cline' },
    ],
    protocol: 'openai',
    steps: [
      { en: 'Open the Cline settings and set API Provider to OpenAI Compatible.', 'zh-CN': '打开 Cline 设置，API Provider 选择 OpenAI Compatible。' },
      { en: 'Enter {baseUrl} as the Base URL, then your API key and the model ID.', 'zh-CN': 'Base URL 填 {baseUrl}，再填入 API Key 与 Model ID。' },
    ],
    note: {
      en: 'You can also use the Anthropic provider: tick "Use custom base URL" and enter {host}. Set the context window under Model Configuration to match the model.',
      'zh-CN': '也可以选择 Anthropic 服务商，勾选 Use custom base URL 并填 {host}。建议在 Model Configuration 中按模型实际情况设置上下文窗口。',
    },
  },
  {
    id: 'kilo-code',
    name: 'Kilo Code',
    summary: {
      en: 'An open-source coding agent for VS Code, also available as a CLI, with built-in support for custom OpenAI-compatible providers.',
      'zh-CN': '开源的 VS Code 编程 Agent，同时提供命令行版本，内置自定义 OpenAI 兼容服务商支持。',
    },
    homepage: 'https://kilo.ai',
    github: 'https://github.com/Kilo-Org/kilocode',
    install: [
      { label: 'VS Code', value: 'code --install-extension kilocode.kilo-code' },
      { label: 'CLI', value: 'npm install -g @kilocode/cli' },
    ],
    protocol: 'openai',
    steps: [
      { en: 'Open Settings → Providers → Custom provider and set Provider API to OpenAI Compatible.', 'zh-CN': '打开 Settings → Providers → Custom provider，Provider API 选择 OpenAI Compatible。' },
      { en: 'Enter {baseUrl} as the Base URL and your API key. Models are fetched from the model list automatically, or you can type a name.', 'zh-CN': 'Base URL 填 {baseUrl} 并填入 API Key；模型会从模型列表自动拉取，也可以手动填写。' },
    ],
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    summary: {
      en: 'Copilot Chat in VS Code can add models from a custom endpoint, and works that way even without a Copilot plan.',
      'zh-CN': 'VS Code 中的 Copilot Chat 支持添加自定义接口的模型，没有 Copilot 订阅也能这样使用。',
    },
    homepage: 'https://code.visualstudio.com/docs/copilot/customization/language-models',
    protocol: 'openai',
    steps: [
      { en: 'From the Command Palette, run Chat: Manage Language Models → Add Models → Custom Endpoint.', 'zh-CN': '在命令面板运行 Chat: Manage Language Models → Add Models → Custom Endpoint。' },
      { en: 'In the file that opens, enter {baseUrl}, your API key and the model name, with the API type set to chat-completions.', 'zh-CN': '在打开的配置文件中填入地址 {baseUrl}、API Key 与模型名，接口类型选 chat-completions。' },
      { en: 'Pick the model from the Copilot Chat model menu.', 'zh-CN': '在 Copilot Chat 的模型下拉菜单中选择该模型。' },
    ],
    note: {
      en: 'Custom models are for chat only, not inline suggestions. On Copilot Business or Enterprise, an admin has to allow them first.',
      'zh-CN': '自定义模型只用于对话，不用于行内补全；Copilot 企业版需要管理员先开启相应策略。',
    },
  },
  {
    id: 'codebuddy',
    name: 'CodeBuddy',
    summary: {
      en: 'Tencent\'s AI coding assistant. The CodeBuddy IDE and CLI read custom OpenAI-format models from a models.json file.',
      'zh-CN': '腾讯出品的 AI 编程助手，CodeBuddy IDE 与 CLI 可以从 models.json 读取 OpenAI 格式的自定义模型。',
    },
    homepage: 'https://www.codebuddy.ai',
    protocol: 'openai',
    url: '{baseUrl}/chat/completions',
    steps: [
      { en: 'Edit ~/.codebuddy/models.json, or .codebuddy/models.json in a project to limit it to that project.', 'zh-CN': '编辑 ~/.codebuddy/models.json；只想对某个项目生效时，放在该项目的 .codebuddy/models.json。' },
      { en: 'Write the full /chat/completions address as url, and put the key itself, not a variable name, in apiKey.', 'zh-CN': 'url 要写完整的 /chat/completions 地址，apiKey 直接填密钥本身，不要填环境变量名。' },
    ],
    config: [
      { label: 'models.json', value: '{\n  "models": [\n    {\n      "id": "YOUR_MODEL",\n      "name": "YOUR_MODEL",\n      "apiKey": "YOUR_API_KEY",\n      "url": "{baseUrl}/chat/completions",\n      "supportsToolCall": true\n    }\n  ]\n}' },
    ],
  },
]
