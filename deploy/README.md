# 静态资源部署与验收

构建命令：`npm ci`、`npm run build`，发布目录为 `dist/`。

首页仅同步加载 React、首页代码和首页样式；Semi UI、控制台、支付与文档随路由加载。Tidio 使用旧站公开站点 ID，随页面打开异步加载，保留原生浮动气泡。上线后在 Tidio 后台核对 `pay.ztoken.cc` 是否允许使用此站点配置。

## 缓存配置

PageSpeed 的 Cache TTL 由生产服务器/CDN 响应头决定，修改 React 或 Vite 构建不会自动修复。此仓库未包含现网 Spring Boot/Nginx 的完整部署配置。

若由 Nginx 直接提供 `dist/`：将 `static-cache.nginx.conf` 合入现有 `server` 块，确认继承的 `root` 指向实际发布目录。保留现有 API 代理、证书及 SPA 回退规则；不要以此片段覆盖完整站点配置。如果已有匹配的 location，把响应头合入原规则，不要重复定义。

若静态资源由 Spring Boot 提供：在对应资源处理器或前置 CDN 中配置相同策略：`/assets/**` 为 `public, max-age=31536000, immutable`，HTML 为 `no-cache`。登录、支付、用户资料等 `/api/**` 响应不能应用公共静态资源缓存规则。

SPA 深链接（如 `/docs/api/seedance`）应回退到 `index.html` 并遵循 HTML 的缓存策略；缺失的 `/assets/*` 必须返回 404。部署时先上传新资源，再更新 HTML，并保留前一版本的指纹资源，避免打开中的页面延迟加载失败。网关应启用 gzip/Brotli；CDN 不应覆盖上述头。

## 上线验收

- 首页 Network 中没有 Semi UI、ECharts、Google Fonts 请求；只有打开功能页或在支持悬停的设备上悬停导航链接才预取对应业务资源；Tidio 会在进入页面时自动加载。
- 首页标题立即可见；移动端导航、语言切换、登录/退出入口正常。
- 右侧“联系我们”包含旧站两个邮箱和 Telegram 二维码；桌面右下角保留 Tidio 原生气泡，使用首页主题绿（`#147b57`），点击直接打开会话。手机端为独立的“联系我们”和“在线客服”两个按钮；登录注册页将按钮放在表单下方，联系面板不嵌套客服入口。聊天脚本被拦截时，联系面板的邮箱和 Telegram 仍可用。
- `/docs/api/seedance` 的中英文目录、示例模型/语言切换正常；模型详情使用 `/v1/videos` JSON 请求，保存并查询 `task.id`。
- 使用 `curl -I` 检查实际指纹资源的长缓存、HTML 的重新验证，以及登录/用户接口未被公共缓存。
- 部署后重新运行移动端 PageSpeed，以线上网络、压缩和响应头为准；本地包体积不能代替线上评分。

## 接口资料来源

Seedance 请求、响应和素材接口依据 `https://ztoken.cc/doc.html`（核对日期 2026-09-14）。旧站为三种 Seedance 别名提供 `/v1/videos`，但实时价格接口将它们标记为通用 OpenAI 端点；前端仅对这三个已记录的精确别名修正端点，不推断其他版本可用。

Telegram 二维码从原图裁去外围留白后压缩，保留码区，点击用户名也可直接打开 Telegram。

财务与技术邮箱、Telegram 二维码依据 `https://ztoken.cc/home.html`；Tidio 公开脚本配置依据 `https://ztoken.cc/`。
