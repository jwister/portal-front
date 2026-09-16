import { ResponsiveTable as Table } from '../../components/ResponsiveTable'
import { Button, Input, Modal, Pagination, Space, Tag, Toast, Typography } from '@douyinfe/semi-ui'
import { IconAlertCircle, IconClock, IconCreditCard, IconRefresh, IconTickCircle } from '@douyinfe/semi-icons'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import '../../i18n'
import { ConsolePageHeader } from '../../components/ConsolePageHeader'
import { MetricCard } from '../../components/MetricCard'
import { RemoteState } from '../../components/RemoteState'
import { ConsoleIcon } from '../../components/ConsoleIcon'
import {
  formatQuota,
  formatUsd,
  cancelPaymentOrder,
  getPaymentOrder,
  getPaymentOrders,
  getTrc20PaymentStatus,
  submitTrc20Txid,
  type PaymentOrder,
  type PaymentOrderPage,
  type PaymentOrderStatus,
  type Trc20PaymentInstruction,
} from '../../api/portal'

const STATUS_COLORS: Record<PaymentOrderStatus, string> = {
  WAITING_PAYMENT: 'blue',
  CONFIRMED: 'blue',
  CREDITING: 'blue',
  PAID: 'green',
  CREDIT_FAILED: 'orange',
  CREDIT_UNKNOWN: 'orange',
  EXPIRED: 'grey',
  CANCELLED: 'grey',
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; page: PaymentOrderPage }
  | { kind: 'error'; message: string }

function formatTimestamp(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

/** 将支付后端的状态码映射为统一的颜色、文案回退值和语义图标。 */
function statusTag(status: PaymentOrderStatus): { color: string; label: string; icon: ReactNode } {
  const icon = status === 'PAID'
    ? <IconTickCircle />
    : status === 'CREDIT_FAILED' || status === 'CREDIT_UNKNOWN'
      ? <IconAlertCircle />
      : status === 'EXPIRED' || status === 'CANCELLED'
        ? <IconAlertCircle />
        : <IconClock />
  return { color: STATUS_COLORS[status], label: status, icon }
}

export function OrdersPage() {
  const { t } = useTranslation()
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [page, setPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<PaymentOrder | null>(null)
  const [trc20Instruction, setTrc20Instruction] = useState<Trc20PaymentInstruction | null>(null)
  const [txid, setTxid] = useState('')
  const [busy, setBusy] = useState<'cancel' | 'txid' | null>(null)
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false)

  /** 列表刷新和详情操作共用同一读取逻辑，避免操作后展示过期的订单状态。 */
  const load = async (showLoading = true) => {
    if (showLoading) setState({ kind: 'loading' })
    try {
      const result = await getPaymentOrders(page, 20)
      setState({ kind: 'ready', page: result })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setState({ kind: 'error', message })
    }
  }

  useEffect(() => {
    void load()
  }, [page])

  /** 从服务端重新读取订单；TRC20 收款信息只在该订单仍为 TRC20 时读取。 */
  const refreshDetail = async (orderNo: string) => {
    const order = await getPaymentOrder(orderNo)
    setSelectedOrder(order)
    if (order.method === 'USDT_TRC20') {
      setTrc20Instruction(await getTrc20PaymentStatus(orderNo))
    } else {
      setTrc20Instruction(null)
    }
    return order
  }

  /** 双击订单后以服务端详情作为全部可操作状态的唯一来源。 */
  const openDetail = async (orderNo: string) => {
    try {
      setTxid('')
      await refreshDetail(orderNo)
    } catch {
      setSelectedOrder(null)
      setTrc20Instruction(null)
      Toast.error(t('orders.detailLoadError'))
    }
  }

  /** 关闭时清空订单专属状态，避免用户输入的 TxID 被带入另一订单。 */
  const closeDetail = () => {
    if (busy) return
    setSelectedOrder(null)
    setTrc20Instruction(null)
    setTxid('')
    setCancelConfirmVisible(false)
  }

  const confirmCancel = async () => {
    if (!selectedOrder) return
    const orderNo = selectedOrder.orderNo
    setBusy('cancel')
    try {
      const next = await cancelPaymentOrder(orderNo)
      setSelectedOrder(next)
      setTrc20Instruction(null)
      setCancelConfirmVisible(false)
      Toast.success(t('orders.cancelSuccess'))
      await load(false)
    } catch {
      Toast.error(t('orders.cancelError'))
      try { await refreshDetail(orderNo) } catch { closeDetail() }
      await load(false)
    } finally {
      setBusy(null)
    }
  }

  const verifyTxid = async () => {
    if (!selectedOrder || !txid.trim()) return
    const orderNo = selectedOrder.orderNo
    setBusy('txid')
    try {
      const result = await submitTrc20Txid(orderNo, txid.trim())
      Toast.success(t(`payment.trc20Result.${result.result}`))
      await refreshDetail(orderNo)
      await load(false)
    } catch {
      Toast.error(t('orders.txidSubmitError'))
      try { await refreshDetail(orderNo) } catch { closeDetail() }
      await load(false)
    } finally {
      setBusy(null)
    }
  }

  if (state.kind === 'loading') {
    return (
      <main>
        <ConsolePageHeader title={t('orders.title')} description={t('orders.description')} />
        <RemoteState kind="loading" />
      </main>
    )
  }

  if (state.kind === 'error') {
    return (
      <main>
        <ConsolePageHeader title={t('orders.title')} description={t('orders.description')} />
        <RemoteState kind="error" onRetry={load} />
        <Typography.Paragraph type="tertiary">{state.message}</Typography.Paragraph>
      </main>
    )
  }

  const { items, total } = state.page
  const canCancel = selectedOrder?.status === 'WAITING_PAYMENT'
  const canRecoverTrc20 = canCancel && selectedOrder?.method === 'USDT_TRC20'

  // 订单状态由支付后端维护；页面仅将已到账和仍在处理的状态分组为摘要，保持原有数据口径。
  const completedCount = items.filter((order) => order.status === 'PAID').length
  const pendingCount = items.filter((order) => ['WAITING_PAYMENT', 'CONFIRMED', 'CREDITING'].includes(order.status)).length

  if (total === 0) {
    return (
      <main>
        <ConsolePageHeader title={t('orders.title')} description={t('orders.description')} />
        <section className="orders-empty-state">
          <p>{t('orders.empty')}</p>
          <a className="console-button orders-empty-recharge" href="/console/recharge"><ConsoleIcon name="recharge" />{t('orders.recharge')}</a>
        </section>
      </main>
    )
  }

  const columns = [
    {
      title: t('orders.orderNo'),
      dataIndex: 'orderNo' as const,
      render: (value: string) => <code>{value}</code>,
    },
    {
      title: t('orders.amount'),
      dataIndex: 'amountUsdMinor' as const,
      render: (value: number) => formatUsd(value),
    },
    {
      title: t('orders.quota'),
      dataIndex: 'quotaToCredit' as const,
      render: (value: number) => formatQuota(value),
    },
    {
      title: t('orders.method'),
      dataIndex: 'method' as const,
      render: (value: string) => value === 'PAYPAL'
        ? <span className="order-payment"><img className="payment-method-logo" src="/Paypal.png" alt="" width="28" height="28" />PayPal</span>
        : value === 'USDT_TRC20'
          ? <span className="order-payment"><img className="payment-method-logo" src="/Tron.png" alt="" width="28" height="28" />TRC20 USDT</span>
          : value,
    },
    {
      title: t('orders.status'),
      dataIndex: 'status' as const,
      render: (value: PaymentOrderStatus) => {
        const meta = statusTag(value)
        return (
          <Tag color={meta.color as 'blue' | 'green' | 'orange' | 'grey'}>
            <span className="order-status-content">{meta.icon}{t(`orders.status.${value.toLowerCase()}`, { defaultValue: meta.label })}</span>
          </Tag>
        )
      },
    },
    {
      title: t('orders.created'),
      dataIndex: 'createdAt' as const,
      render: (value: string) => formatTimestamp(value),
    },
    {
      title: t('orders.expires'),
      dataIndex: 'expiresAt' as const,
      render: (value: string) => formatTimestamp(value),
    },
  ]

  return (
    <main>
      <ConsolePageHeader
        title={t('orders.title')}
        description={t('orders.description')}
        actions={
          <Space>
            <Button icon={<IconRefresh />} onClick={() => { void load() }}>{t('common.refresh', { defaultValue: t('common.retry') })}</Button>
          </Space>
        }
      />
      <section className="console-summary-grid" aria-label={t('orders.title')}>
        <MetricCard label={t('orders.total')} value={total} icon={<IconCreditCard />} tone="blue" />
        <MetricCard label={t('orders.completed')} value={completedCount} icon={<IconTickCircle />} tone="mint" />
        <MetricCard label={t('orders.pending')} value={pendingCount} icon={<IconClock />} tone="amber" />
      </section>
      <div className="console-table-wrap">
        <Table<PaymentOrder>
          dataSource={items}
          columns={columns}
          rowKey={(row) => row?.orderNo ?? ''}
          pagination={false}
          onRow={(record) => ({ onDoubleClick: () => { void openDetail(record.orderNo) } })}
        />
      </div>
      {total > 20 && <Pagination currentPage={page} pageSize={20} total={total} onPageChange={setPage} />}
      <Modal
        title={t('orders.detailTitle')}
        visible={selectedOrder !== null}
        onCancel={closeDetail}
        closeOnEsc={!busy}
        maskClosable={!busy}
        footer={<Button disabled={Boolean(busy)} onClick={closeDetail}>{t('orders.close')}</Button>}
      >
        {selectedOrder && <section aria-label={t('orders.detailTitle')}>
          <Typography.Paragraph type="tertiary">{t('orders.detailHint')}</Typography.Paragraph>
          <Typography.Paragraph><strong>{t('orders.orderNo')}：</strong><code>{selectedOrder.orderNo}</code></Typography.Paragraph>
          <Typography.Paragraph><strong>{t('orders.amount')}：</strong>{formatUsd(selectedOrder.amountUsdMinor)}</Typography.Paragraph>
          <Typography.Paragraph><strong>{t('orders.quota')}：</strong>{formatQuota(selectedOrder.quotaToCredit)}</Typography.Paragraph>
          <Typography.Paragraph><strong>{t('orders.method')}：</strong>{selectedOrder.method === 'USDT_TRC20' ? 'TRC20 USDT' : 'PayPal'}</Typography.Paragraph>
          <Typography.Paragraph><strong>{t('orders.created')}：</strong>{formatTimestamp(selectedOrder.createdAt)}</Typography.Paragraph>
          <Typography.Paragraph><strong>{t('orders.expires')}：</strong>{formatTimestamp(selectedOrder.expiresAt)}</Typography.Paragraph>
          <Typography.Paragraph><strong>{t('orders.status')}：</strong>{t(`orders.status.${selectedOrder.status.toLowerCase()}`)}</Typography.Paragraph>
          {canRecoverTrc20 && trc20Instruction && <section className="trc20-checkout">
            <Typography.Title heading={5}>{t('orders.trc20Recovery')}</Typography.Title>
            <Typography.Paragraph type="tertiary">{t('orders.trc20RecoveryHint')}</Typography.Paragraph>
            <div className="trc20-instruction">
              <div><span>{t('payment.trc20Amount')}</span><strong>{trc20Instruction.payableAmount} {trc20Instruction.payableCurrency}</strong></div>
              <div><span>{t('payment.trc20Address')}</span><code>{trc20Instruction.receiveAddress}</code></div>
            </div>
            <div className="trc20-txid">
              <Input aria-label={t('payment.trc20Txid')} disabled={busy === 'txid'} value={txid} onChange={setTxid} placeholder={t('payment.trc20TxidPlaceholder')} />
              <Button type="primary" loading={busy === 'txid'} disabled={!txid.trim() || Boolean(busy)} onClick={() => { void verifyTxid() }}>{t('payment.trc20Verify')}</Button>
            </div>
          </section>}
          {canCancel && <Button type="danger" theme="solid" disabled={Boolean(busy)} onClick={() => setCancelConfirmVisible(true)}>{t('orders.cancel')}</Button>}
        </section>}
      </Modal>
      <Modal
        title={t('orders.cancelConfirmTitle')}
        visible={cancelConfirmVisible}
        closable={!busy}
        maskClosable={!busy}
        onCancel={() => { if (!busy) setCancelConfirmVisible(false) }}
        footer={<Space><Button disabled={Boolean(busy)} onClick={() => setCancelConfirmVisible(false)}>{t('orders.close')}</Button><Button theme="solid" type="danger" loading={busy === 'cancel'} disabled={Boolean(busy)} onClick={() => { void confirmCancel() }}>{t('orders.cancelConfirm')}</Button></Space>}
      >
        <Typography.Paragraph>{t('orders.cancelConfirmContent')}</Typography.Paragraph>
      </Modal>
    </main>
  )
}
