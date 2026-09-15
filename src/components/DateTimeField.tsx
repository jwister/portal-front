import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ConsoleIcon } from './ConsoleIcon'

const pad=(value:number|string)=>String(value).padStart(2,'0')
const dateString=(date:Date)=>`${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`
const parseDate=(value:string)=>{const date=new Date(value);return Number.isNaN(date.getTime())?new Date():date}

export function DateTimeField({label,value,onChange,min,max}:{label:string;value:string;onChange:(value:string)=>void;min?:string;max?:string}) {
  const {t,i18n}=useTranslation(), id=useId()
  const trigger=useRef<HTMLButtonElement>(null), dialog=useRef<HTMLDialogElement>(null)
  const [open,setOpen]=useState(false), [selected,setSelected]=useState(()=>parseDate(value)), [month,setMonth]=useState(()=>parseDate(value))
  const [hour,setHour]=useState('00'), [minute,setMinute]=useState('00')
  const [position,setPosition]=useState({left:16,top:16})
  const choose=()=>{
    const date=parseDate(value), rect=trigger.current!.getBoundingClientRect()
    setSelected(date);setMonth(new Date(date.getFullYear(),date.getMonth(),1));setHour(pad(date.getHours()));setMinute(pad(date.getMinutes()))
    setPosition({left:Math.max(16,Math.min(rect.left,window.innerWidth-376)),top:Math.max(16,Math.min(rect.bottom+8,window.innerHeight-550))});setOpen(true)
  }
  useEffect(()=>{
    if(!open)return
    if(dialog.current?.showModal)dialog.current.showModal();else dialog.current?.setAttribute('open','')
    const height=dialog.current?.getBoundingClientRect().height??0
    setPosition(current=>({...current,top:Math.max(16,Math.min(current.top,window.innerHeight-height-16))}))
    dialog.current?.querySelector<HTMLButtonElement>('.console-calendar-day[aria-pressed=true]')?.focus()
    return ()=>trigger.current?.focus()
  },[open])
  const start=new Date(month.getFullYear(),month.getMonth(),1), offset=(start.getDay()+6)%7
  const days=Array.from({length:42},(_,index)=>new Date(month.getFullYear(),month.getMonth(),index-offset+1))
  const weekdays=useMemo(()=>{const formatter=new Intl.DateTimeFormat(i18n.language,{weekday:'short'});return Array.from({length:7},(_,index)=>formatter.format(new Date(2026,0,5+index)))},[i18n.language])
  const dayFormatter=useMemo(()=>new Intl.DateTimeFormat(i18n.language,{year:'numeric',month:'long',day:'numeric'}),[i18n.language])
  const dateAllowed=(date:Date)=>(!min||dateString(date)>=min.slice(0,10))&&(!max||dateString(date)<=max.slice(0,10))
  const focusDate=days.some(date=>dateString(date)===dateString(selected)&&dateAllowed(date))?dateString(selected):dateString(days.find(date=>date.getMonth()===month.getMonth()&&dateAllowed(date))??start)
  const draft=`${dateString(selected)}T${pad(hour)}:${pad(minute)}`
  const valid=/^\d{1,2}$/.test(hour)&&/^\d{1,2}$/.test(minute)&&Number(hour)>=0&&Number(hour)<24&&Number(minute)>=0&&Number(minute)<60&&(!min||draft>=min)&&(!max||draft<=max)
  const labelDate=(date:Date)=>dayFormatter.format(date)
  const moveMonth=(direction:number)=>setMonth(new Date(month.getFullYear(),month.getMonth()+direction,1))
  return <div className="console-field"><span id={id}>{label}</span><button ref={trigger} type="button" className="console-date-trigger" aria-labelledby={`${id} ${id}-value`} aria-haspopup="dialog" aria-expanded={open} onClick={choose}><span id={`${id}-value`}>{value?value.replace('T','  ').replaceAll('-','/'):t('date.select')}</span><ConsoleIcon name="calendar" /></button>
    {open && <dialog ref={dialog} className="console-date-dialog" style={{left:position.left,top:position.top}} aria-labelledby={`${id}-title`} onKeyDown={(event)=>{if(event.key==='Enter'&&event.target instanceof HTMLInputElement){event.preventDefault();if(valid){onChange(draft);setOpen(false)}}}} onCancel={(event)=>{event.preventDefault();setOpen(false)}} onClick={(event)=>{if(event.target!==event.currentTarget)return;const rect=event.currentTarget.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)setOpen(false)}}>
      <header><h2 id={`${id}-title`}>{label}</h2><button type="button" aria-label={t('date.close')} onClick={()=>setOpen(false)}><ConsoleIcon name="close" /></button></header>
      <div className="console-calendar-month"><button type="button" aria-label={t('date.previousMonth')} onClick={()=>moveMonth(-1)}><ConsoleIcon name="chevron" /></button><strong aria-live="polite">{new Intl.DateTimeFormat(i18n.language,{year:'numeric',month:'long'}).format(month)}</strong><button type="button" aria-label={t('date.nextMonth')} onClick={()=>moveMonth(1)}><ConsoleIcon name="chevron" /></button></div>
      <div className="console-calendar-weekdays" aria-hidden="true">{weekdays.map((day,index)=><span key={index}>{day}</span>)}</div>
      <div className="console-calendar-days" role="group" aria-label={t('date.calendar')} onKeyDown={(event)=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return
        const current=(event.target as HTMLElement).getAttribute('data-date');if(!current)return
        event.preventDefault();const next=parseDate(current+'T12:00');next.setDate(next.getDate()+(({ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7} as Record<string,number>)[event.key]??0))
        if(!dateAllowed(next))return
        setSelected(next);setMonth(new Date(next.getFullYear(),next.getMonth(),1))
        requestAnimationFrame(()=>dialog.current?.querySelector<HTMLButtonElement>(`[data-date="${dateString(next)}"]`)?.focus())
      }}>{days.map(date=><button type="button" className={`console-calendar-day${date.getMonth()!==month.getMonth()?' is-outside':''}`} key={dateString(date)} data-date={dateString(date)} aria-label={labelDate(date)} aria-current={dateString(date)===dateString(new Date())?'date':undefined} aria-pressed={dateString(date)===dateString(selected)} tabIndex={dateString(date)===focusDate?0:-1} disabled={!dateAllowed(date)} onClick={()=>{setSelected(date);setMonth(new Date(date.getFullYear(),date.getMonth(),1))}}>{date.getDate()}</button>)}</div>
      <div className="console-calendar-time"><span>{t('date.time')}</span><label><span className="console-sr-only">{t('date.hour')}</span><input type="number" inputMode="numeric" min="0" max="23" value={hour} onChange={event=>setHour(event.target.value)} onBlur={()=>setHour(pad(hour))} /></label><span aria-hidden="true">:</span><label><span className="console-sr-only">{t('date.minute')}</span><input type="number" inputMode="numeric" min="0" max="59" value={minute} onChange={event=>setMinute(event.target.value)} onBlur={()=>setMinute(pad(minute))} /></label></div>
      {!valid && <p className="console-date-error" role="alert">{t('date.rangeError')}</p>}
      <footer><button type="button" onClick={()=>{onChange('');setOpen(false)}}>{t('date.clear')}</button><button type="button" onClick={()=>{const now=new Date();setSelected(now);setMonth(new Date(now.getFullYear(),now.getMonth(),1));setHour(pad(now.getHours()));setMinute(pad(now.getMinutes()))}}>{t('date.now')}</button><button type="button" className="console-date-apply" disabled={!valid} onClick={()=>{onChange(draft);setOpen(false)}}>{t('date.apply')}</button></footer>
    </dialog>}
  </div>
}
