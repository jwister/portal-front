const ADS_ID = 'AW-18368347101'
const REGISTRATION_TARGET = `${ADS_ID}/HAU6CParo-EcEN332rZE`
const PURCHASE_TARGET = `${ADS_ID}/lxjbCNK_x4cdEN332rZE`
const EVENT_TIMEOUT = 2000
let initialized = false
const purchaseAttempts = new Set<string>()

declare global {
  interface Window { gtag?: (...args: unknown[]) => void }
}

/** 首屏建立命令队列并配置 Ads，复用现有 GTM dataLayer；脚本下载交给空闲调度或业务事件。 */
export function initializeGoogleAds(): void {
  if (initialized) return
  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function () { window.dataLayer!.push(arguments) }
  try {
    window.gtag('js', new Date())
    window.gtag('config', ADS_ID)
    initialized = true
  } catch { /* 既有统计脚本异常时仍继续页面启动，业务上报可在下次调用时重试。 */ }
}

/** 幂等加载 Google tag，业务事件可提前调用，避免注册回跳早于空闲加载。 */
export function loadGoogleAds(): void {
  initializeGoogleAds()
  if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`
  // 临时断网不应让失败标签永久占位；下一次业务事件可重试，队列仍保留在 dataLayer。
  script.onerror = () => { script.remove(); purchaseAttempts.clear() }
  document.head.append(script)
}

/** 注册只由实际成功入口调用；等待事件处理回调，脚本阻断或异常时最多等待两秒。 */
export function trackRegistration(): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(resolve, EVENT_TIMEOUT)
    const finish = () => { window.clearTimeout(timer); resolve() }
    try {
      loadGoogleAds()
      window.gtag!('event', 'conversion', {
        send_to: REGISTRATION_TARGET, event_callback: finish, event_timeout: EVENT_TIMEOUT,
      })
    } catch { finish() }
  })
}

interface PurchaseConversionOrder {
  orderNo: string
  status: string
  amountUsdMinor: number
  conversionValue?: number
  conversionCurrency?: string
}

/** 仅接受服务端 PAID 订单。金额与币种成对使用，旧版美元响应可从美分还原。 */
export function trackPurchase(order: PurchaseConversionOrder): void {
  if (order.status !== 'PAID' || !order.orderNo?.trim()) return
  const currency = order.conversionCurrency?.trim().toUpperCase() || 'USD'
  if (currency !== 'USD' && currency !== 'CNY') return
  // 人民币必须有对应人民币金额，不能把美元数字直接贴上 CNY 标签。
  const value = order.conversionValue ?? (currency === 'USD' ? order.amountUsdMinor / 100 : NaN)
  if (!Number.isFinite(value) || value <= 0) return
  const key = `ztoken.ads.purchase:${PURCHASE_TARGET}:${order.orderNo}`
  if (purchaseAttempts.has(key)) return
  try { if (localStorage.getItem(key)) return } catch { /* 存储不可用时仍由内存和 Google 订单号去重。 */ }
  purchaseAttempts.add(key)
  try {
    loadGoogleAds()
    window.gtag!('event', 'conversion', {
      send_to: PURCHASE_TARGET, value, currency, transaction_id: order.orderNo,
      // 回调表示脚本已处理事件，不代表 Ads 服务端确认；被拦截时不写持久标记，下次访问可重试。
      event_callback: () => { try { localStorage.setItem(key, '1') } catch { /* 不影响支付成功展示。 */ } },
      event_timeout: EVENT_TIMEOUT,
    })
  } catch { purchaseAttempts.delete(key) }
}
