'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Search, Plus, Menu, LogOut, User, Home,
  Users, Building2, FileText, StickyNote, X
} from 'lucide-react';
import styles from './Topbar.module.css';

export default function Topbar({ onMenuToggle }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const quickAddRef = useRef(null);
  const userMenuRef = useRef(null);
  const router = useRouter();
  const supabase = createClient();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) {
        setShowQuickAdd(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const quickAddItems = [
    { label: 'Property', href: '/properties/add', icon: Home },
    { label: 'Contact', href: '/contacts/add', icon: Users },
    { label: 'Development', href: '/developments/add', icon: Building2 },
    { label: 'Document', href: '/documents', icon: FileText },
    { label: 'Note', href: '/notes?action=add', icon: StickyNote },
  ];

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle}>
          <Menu size={20} />
        </button>

        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search properties, contacts, areas, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className={styles.right}>
        {/* Quick Add */}
        <div className={styles.dropdown} ref={quickAddRef}>
          <button
            className={`btn btn-primary btn-sm ${styles.quickAddBtn}`}
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            <Plus size={16} />
            <span className={styles.quickAddLabel}>Add</span>
          </button>

          {showQuickAdd && (
            <div className={styles.dropdownMenu}>
              {quickAddItems.map((item) => (
                <button
                  key={item.label}
                  className={styles.dropdownItem}
                  onClick={() => {
                    setShowQuickAdd(false);
                    router.push(item.href);
                  }}
                >
                  <item.icon size={16} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className={styles.dropdown} ref={userMenuRef}>
          <button
            className={styles.avatarBtn}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <User size={18} />
          </button>

          {showUserMenu && (
            <div className={styles.dropdownMenu}>
              <button
                className={styles.dropdownItem}
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/settings');
                }}
              >
                <User size={16} />
                <span>Settings</span>
              </button>
              <div className={styles.dropdownDivider} />
              <button
                className={`${styles.dropdownItem} ${styles.danger}`}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
