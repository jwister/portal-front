export type ConsoleIconName = 'dashboard' | 'recharge' | 'tokens' | 'logs' | 'profile' | 'orders' | 'menu' | 'close' | 'arrow' | 'refresh' | 'activity' | 'docs' | 'logout' | 'chevron' | 'language' | 'search' | 'filter' | 'calendar'

export function ConsoleIcon({ name }: { name: ConsoleIconName }) {
  const paths: Record<ConsoleIconName, React.ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m4 0h2m-8 3h2" /></>,
    search: <><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></>,
    filter: <><path d="M4 7h16M7 17h10" /><circle cx="9" cy="7" r="2" fill="currentColor" /><circle cx="15" cy="17" r="2" fill="currentColor" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a18 18 0 0 1 0 18 18 18 0 0 1 0-18Z" /></>,
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    recharge: <><rect x="3" y="5" width="18" height="15" rx="3" /><path d="M3 9h18m-6 5h3M6 5V3h12" /></>,
    tokens: <><circle cx="8" cy="8" r="5" /><path d="m12 12 9 9m-5-5 3-3m-1 5 3-3" /></>,
    logs: <><path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm1 5h8m-8 4h8m-8 4h5" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    orders: <><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    refresh: <><path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" /></>,
    activity: <path d="M2 12h5l3-8 4 16 3-8h5" />,
    docs: <><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" /></>,
    logout: <><path d="M9 4H4v16h5m5-12 4 4-4 4m-5-4h13" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
