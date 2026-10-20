'use client';

import { useSyncExternalStore } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SIDEBAR_EVENT, SIDEBAR_KEY } from '@/lib/preferences';

const isCollapsed = () => document.documentElement.dataset.sidebar === 'collapsed';

function subscribe(onChange: () => void) {
  window.addEventListener(SIDEBAR_EVENT, onChange);
  return () => window.removeEventListener(SIDEBAR_EVENT, onChange);
}

/** Switches the desktop sidebar between full width and icons only. */
export default function SidebarToggle({ className = '' }: { className?: string }) {
  const collapsed = useSyncExternalStore(subscribe, isCollapsed, () => null);

  const toggle = () => {
    const next = !isCollapsed();
    if (next) document.documentElement.dataset.sidebar = 'collapsed';
    else delete document.documentElement.dataset.sidebar;
    try { localStorage.setItem(SIDEBAR_KEY, next ? 'collapsed' : 'expanded'); } catch { /* private browsing */ }
    window.dispatchEvent(new Event(SIDEBAR_EVENT));
  };

  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  return (
    <button onClick={toggle} aria-label={label} title={label} aria-expanded={collapsed === null ? undefined : !collapsed} className={className}>
      {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
    </button>
  );
}
