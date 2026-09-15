import { useEffect, useRef, useState } from 'react'
import type { EChartsOption } from 'echarts'
import type { EChartsType } from 'echarts/core'
import { useTranslation } from 'react-i18next'

interface DashboardChartProps { title: string; summary?: string; accessibleDescription: string; option: EChartsOption }

export function DashboardChart({ title, summary, accessibleDescription, option }: DashboardChartProps) {
  const elementRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<EChartsType | null>(null)
  const optionRef = useRef(option)
  const [failed, setFailed] = useState(false)
  const [revision, setRevision] = useState(0)
  const { t } = useTranslation()
  optionRef.current = option

  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    const context = document.createElement('canvas').getContext('2d')
    if (!context || typeof context.measureText !== 'function') return
    let disposed = false
    let started = false
    let frame = 0
    let observer: ResizeObserver | undefined
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => chartRef.current?.setOption({ animation: !motion.matches })
    const resize = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(() => chartRef.current?.resize()) }
    const start = async () => {
      if (started) return
      started = true
      try {
        const { initChart } = await import('./chart-runtime')
        if (disposed) return
        chartRef.current = initChart(element, undefined, { devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2) })
        chartRef.current.setOption({ ...optionRef.current, animation: !motion.matches, animationDuration: 250 }, { notMerge: true })
        if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(resize); observer.observe(element) }
        else window.addEventListener('resize', resize)
        motion.addEventListener?.('change', updateMotion)
      } catch { if (!disposed) setFailed(true) }
    }
    const visibility = typeof IntersectionObserver === 'undefined' ? undefined : new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { visibility?.disconnect(); void start() }
    }, { rootMargin: '160px' })
    if (visibility) visibility.observe(element)
    else void start()
    return () => {
      disposed = true; visibility?.disconnect(); observer?.disconnect(); cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize); motion.removeEventListener?.('change', updateMotion)
      chartRef.current?.dispose(); chartRef.current = null
    }
  }, [revision])
  useEffect(() => {
    chartRef.current?.setOption({ ...option, animation: !window.matchMedia('(prefers-reduced-motion: reduce)').matches }, { notMerge: true })
  }, [option])

  return <section className="dashboard-chart" role="region" aria-label={title}>
    <header className="dashboard-chart-header"><h2>{title}</h2>{summary && <span>{summary}</span>}</header>
    <p className="dashboard-chart-accessible-description">{accessibleDescription}</p>
    {failed && <button className="console-button" type="button" onClick={() => { setFailed(false); setRevision((value) => value + 1) }}>{t('common.retry')}</button>}
    <div ref={elementRef} className="dashboard-chart-canvas" />
  </section>
}
