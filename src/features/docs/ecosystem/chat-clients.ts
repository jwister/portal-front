import type { Entry, Text } from './types'

export const updated = '2026-10-12'

export const intro: Text = {
  en: 'Desktop and web chat apps that work with ZToken once you add it as an OpenAI-compatible provider.',
  'zh-CN': '把 ZToken 添加为「OpenAI 兼容」服务商后即可使用的桌面与网页对话客户端。',
}

export const entries: Entry[] = [
  {
    id: 'cherry-studio',
    name: 'Cherry Studio',
    summary: {
      en: 'A desktop AI client for Windows, macOS and Linux with chat, agents and a large set of built-in assistants. Download it from the website or GitHub Releases.',
      'zh-CN': '支持 Windows、macOS 与 Linux 的桌面 AI 客户端，集成对话、智能体与大量内置助手，可从官网或 GitHub Releases 下载。',
    },
    homepage: 'https://cherryai.com',
    github: 'https://github.com/CherryHQ/cherry-studio',
    protocol: 'openai',
    url: '{host}',
    steps: [
      { en: 'Open Settings → Model Services → Add Provider and choose the OpenAI type.', 'zh-CN': '打开设置 → 模型服务 → 添加服务商，类型选择 OpenAI。' },
      { en: 'Enter {host} as the API address (Cherry Studio adds /v1 itself) and your API key.', 'zh-CN': 'API 地址填 {host}（Cherry Studio 会自动补上 /v1），再填入 API 密钥。' },
      { en: 'Fetch the model list or add model names, then start chatting.', 'zh-CN': '获取模型列表或手动添加模型名后即可对话。' },
    ],
    note: {
      en: 'End the address with # and Cherry Studio uses it exactly as typed, without adding a path.',
      'zh-CN': '地址末尾加 # 时，Cherry Studio 会原样使用你填写的地址，不再自动补路径。',
    },
  },
  {
    id: 'lobehub',
    name: 'LobeHub',
    summary: {
      en: 'An open-source AI workspace (formerly LobeChat) that runs in the browser, as a desktop app or self-hosted.',
      'zh-CN': '开源的 AI 工作台（原 LobeChat），可在浏览器、桌面端使用，也可以自行部署。',
    },
    homepage: 'https://lobehub.com',
    github: 'https://github.com/lobehub/lobehub',
    protocol: 'openai',
    steps: [
      { en: 'Open Settings → AI Providers → OpenAI.', 'zh-CN': '打开设置 → AI 服务商 → OpenAI。' },
      { en: 'Enter your API key and set the Proxy URL to {baseUrl}.', 'zh-CN': '填入 API Key，代理地址（Proxy URL）填 {baseUrl}。' },
      { en: 'Fetch the model list, or add model names by hand.', 'zh-CN': '获取模型列表，或手动添加模型名。' },
    ],
    config: [
      { label: { en: 'Self-hosted (.env)', 'zh-CN': '自行部署（.env）' }, value: 'OPENAI_API_KEY=YOUR_API_KEY\nOPENAI_PROXY_URL={baseUrl}\nOPENAI_MODEL_LIST=+YOUR_MODEL' },
    ],
    note: {
      en: 'If replies come back empty, check that the address ends in /v1.',
      'zh-CN': '如果回复为空，先检查地址是否以 /v1 结尾。',
    },
  },
  {
    id: 'chatbox',
    name: 'Chatbox',
    summary: {
      en: 'A desktop, mobile and web chat client. Download it from the website.',
      'zh-CN': '覆盖桌面、移动端与网页的 AI 对话客户端，从官网下载安装。',
    },
    homepage: 'https://chatboxai.app',
    github: 'https://github.com/chatboxai/chatbox',
    protocol: 'openai',
    steps: [
      { en: 'Open Settings → Model Provider → Add and choose OpenAI API Compatible.', 'zh-CN': '打开设置 → 模型提供方 → 添加，选择 OpenAI API Compatible。' },
      { en: 'Set API Host to {baseUrl}, API Path to /chat/completions, and enter your API key.', 'zh-CN': 'API Host 填 {baseUrl}，API Path 填 /chat/completions，再填入 API Key。' },
      { en: 'Add at least one model name, then click Check.', 'zh-CN': '至少添加一个模型名，然后点击检查连接。' },
    ],
    note: {
      en: 'Don\'t repeat /v1 in both API Host and API Path.',
      'zh-CN': '不要在 API Host 和 API Path 里重复写 /v1。',
    },
  },
  {
    id: 'open-webui',
    name: 'Open WebUI',
    summary: {
      en: 'A self-hosted web chat interface for teams, which you run with pip or Docker.',
      'zh-CN': '可自行部署的网页对话界面，适合团队共用，通过 pip 或 Docker 运行。',
    },
    homepage: 'https://docs.openwebui.com',
    github: 'https://github.com/open-webui/open-webui',
    install: [
      { label: 'pip', value: 'pip install open-webui\nopen-webui serve' },
      { label: 'Docker', value: 'docker run -d -p 3000:8080 \\\n  -v open-webui:/app/backend/data \\\n  --name open-webui ghcr.io/open-webui/open-webui:main' },
    ],
    protocol: 'openai',
    steps: [
      { en: 'Open Admin Settings → Connections → OpenAI → Add Connection.', 'zh-CN': '打开管理员设置 → 外部连接 → OpenAI → 添加连接。' },
      { en: 'Enter {baseUrl} as the URL and your API key, then save.', 'zh-CN': 'URL 填 {baseUrl}，填入 API Key 后保存。' },
    ],
    config: [
      { label: { en: 'Docker with ZToken preset', 'zh-CN': 'Docker 启动时预置' }, value: 'docker run -d -p 3000:8080 \\\n  -e OPENAI_API_BASE_URL="{baseUrl}" \\\n  -e OPENAI_API_KEY="YOUR_API_KEY" \\\n  -v open-webui:/app/backend/data \\\n  --name open-webui ghcr.io/open-webui/open-webui:main' },
    ],
    note: {
      en: 'The pip install needs Python 3.11 or 3.12.',
      'zh-CN': 'pip 安装需要 Python 3.11 或 3.12。',
    },
  },
]
