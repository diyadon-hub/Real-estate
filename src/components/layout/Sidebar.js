'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Home, Map, FileText, Users, Building2,
  BarChart3, Calculator, StickyNote, Bell, Search, Settings,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import styles from './Sidebar.module.css';

const iconMap = {
  LayoutDashboard, Home, Map, FileText, Users, Building2,
  BarChart3, Calculator, StickyNote, Bell, Search, Settings,
};

const NAV_MAIN = [
  { label: 'Dashboard', href: '/', icon: 'LayoutDashboard' },
  { label: 'Properties', href: '/properties', icon: 'Home' },
  { label: 'Areas', href: '/areas', icon: 'Map' },
  { label: 'Documents', href: '/documents', icon: 'FileText' },
  { label: 'Contacts', href: '/contacts', icon: 'Users' },
  { label: 'Developments', href: '/developments', icon: 'Building2' },
  { label: 'Analytics', href: '/analytics', icon: 'BarChart3' },
  { label: 'Calculator', href: '/calculator', icon: 'Calculator' },
  { label: 'Notes', href: '/notes', icon: 'StickyNote' },
];

const NAV_SYSTEM = [
  { label: 'Follow-ups', href: '/follow-ups', icon: 'Bell' },
  { label: 'Search', href: '/search', icon: 'Search' },
  { label: 'Settings', href: '/settings', icon: 'Settings' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const renderNavItem = (item) => {
    const Icon = iconMap[item.icon];
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${styles.navItem} ${active ? styles.active : ''}`}
        title={collapsed ? item.label : undefined}
      >
        <Icon size={18} strokeWidth={1.8} />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.header}>
          {!collapsed && (
            <Link href="/" className={styles.logo}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#2563EB" />
                <path d="M8 22V14L16 8L24 14V22H19V17H13V22H8Z" fill="white" />
              </svg>
              <span className={styles.logoText}>RealEstate</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className={styles.logoCollapsed}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#2563EB" />
                <path d="M8 22V14L16 8L24 14V22H19V17H13V22H8Z" fill="white" />
              </svg>
            </Link>
          )}
        </div>

        <nav className={styles.nav}>
          <div className={styles.navSection}>
            {!collapsed && <span className={styles.navLabel}>REAL ESTATE</span>}
            {NAV_MAIN.map(renderNavItem)}
          </div>

          <div className={styles.navSection}>
            {!collapsed && <span className={styles.navLabel}>SYSTEM</span>}
            {NAV_SYSTEM.map(renderNavItem)}
          </div>
        </nav>

        <button className={styles.collapseBtn} onClick={onToggle} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>
    </>
  );
}
