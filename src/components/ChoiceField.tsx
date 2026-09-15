import { useEffect, useId, useRef } from 'react'
import { ConsoleIcon } from './ConsoleIcon'

export function ChoiceField({ label, value, options, onChange }: { label:string; value:string; options:{value:string;label:string}[]; onChange:(value:string)=>void }) {
  const id=useId(), menu=useRef<HTMLDetailsElement>(null)
  const close=() => { menu.current?.removeAttribute('open'); menu.current?.querySelector('summary')?.focus() }
  useEffect(() => {
    const outside=(event:PointerEvent) => { if(event.target instanceof Node && !menu.current?.contains(event.target)) menu.current?.removeAttribute('open') }
    document.addEventListener('pointerdown',outside)
    return () => document.removeEventListener('pointerdown',outside)
  },[])
  const selected=options.find(option=>option.value===value)
  return <div className="console-field"><span id={id}>{label}</span><details ref={menu} className="console-choice" onKeyDown={(event)=>{
    if(event.key==='Escape') { event.preventDefault(); close(); return }
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return
    event.preventDefault(); menu.current?.setAttribute('open','')
    const buttons=Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role=option]')??[])
    const index=buttons.indexOf(document.activeElement as HTMLButtonElement)
    const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:index<0?Math.max(0,options.findIndex(option=>option.value===value)):(index+(event.key==='ArrowUp'?-1:1)+buttons.length)%buttons.length
    buttons[next]?.focus()
  }}><summary aria-labelledby={`${id} ${id}-value`} aria-haspopup="listbox"><span id={`${id}-value`}>{selected?.label}</span><ConsoleIcon name="chevron" /></summary><div className="console-choice-options" role="listbox" aria-labelledby={id}>{options.map(option=><button type="button" key={option.value} role="option" aria-selected={option.value===value} onClick={()=>{onChange(option.value);close()}}>{option.label}{option.value===value && <span aria-hidden="true">✓</span>}</button>)}</div></details></div>
}
