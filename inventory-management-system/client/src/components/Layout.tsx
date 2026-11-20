import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Boxes, ChevronDown, LayoutDashboard, LogOut, Menu, Palette, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDialogElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const isOpeningRef = useRef(false);

  const hasUser = Boolean(user);

  const openDrawer = useCallback(async () => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer || !scroller || drawer.open) return;

    isOpeningRef.current = true;
    setDrawerOpen(true);
    drawer.showModal();

    if (!CSS.supports('scroll-initial-target', 'nearest')) {
      scroller.scrollTo({
        left: scroller.offsetWidth,
        behavior: 'instant' as ScrollBehavior,
      });
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
    }

    if (drawer.open) {
      scroller.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, []);

  const closeDrawer = useCallback(() => {
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    if (!drawer || !scroller || !drawer.open) return;

    isOpeningRef.current = false;
    scroller.scrollTo({ left: scroller.offsetWidth, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!hasUser) return;
    const drawer = drawerRef.current;
    const scroller = scrollerRef.current;
    const sheet = sheetRef.current;
    if (!drawer || !scroller || !sheet) return;

    const supportsScrollTimeline = CSS.supports('animation-timeline: scroll()');
    const visibleThreshold = Math.min(0.01, 1 / Math.max(window.innerWidth, 1));

    const observer = new IntersectionObserver(
      (entries) => {
        if (!drawer.open) return;
        const entry = entries[entries.length - 1];
        if (!entry) return;

        if (entry.intersectionRatio >= visibleThreshold) {
          isOpeningRef.current = false;
        }
        if (entry.intersectionRatio === 1) {
          setDrawerOpen(true);
          if (!supportsScrollTimeline) {
            drawer.style.setProperty('--drawer-backdrop', '1');
          }
        } else if (entry.intersectionRatio < visibleThreshold && !isOpeningRef.current) {
          drawer.close();
          setDrawerOpen(false);
        }
      },
      { root: drawer, threshold: [visibleThreshold, 1] }
    );
    observer.observe(sheet);

    const handleScroll = () => {
      if (supportsScrollTimeline || sheet.offsetWidth <= 0) return;
      const ratio = Math.max(0, Math.min(1, 1 - scroller.scrollLeft / sheet.offsetWidth));
      drawer.style.setProperty('--drawer-backdrop', String(ratio));
    };
    if (!supportsScrollTimeline) {
      scroller.addEventListener('scroll', handleScroll, { passive: true });
    }

    const handleDrawerClick = (event: MouseEvent) => {
      if (!sheet.contains(event.target as Node)) {
        closeDrawer();
      }
    };

    const handleCancel = (event: Event) => {
      if (event.cancelable) {
        event.preventDefault();
        closeDrawer();
      }
    };

    const handleNativeClose = () => {
      isOpeningRef.current = false;
      setDrawerOpen(false);
      if (!supportsScrollTimeline) {
        drawer.style.setProperty('--drawer-backdrop', '0');
      }
    };

    const desktopQuery = window.matchMedia('(min-width: 768px)');
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches && drawer.open) {
        drawer.close();
      }
    };

    drawer.addEventListener('click', handleDrawerClick);
    drawer.addEventListener('cancel', handleCancel);
    drawer.addEventListener('close', handleNativeClose);
    desktopQuery.addEventListener('change', handleViewportChange);

    return () => {
      observer.disconnect();
      if (!supportsScrollTimeline) {
        scroller.removeEventListener('scroll', handleScroll);
      }
      drawer.removeEventListener('click', handleDrawerClick);
      drawer.removeEventListener('cancel', handleCancel);
      drawer.removeEventListener('close', handleNativeClose);
      desktopQuery.removeEventListener('change', handleViewportChange);
    };
  }, [hasUser, closeDrawer]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#F5F6FA]/95 backdrop-blur-sm border-b border-[#E5E7EB]/60 px-3 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 md:gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center shadow-card">
              <Boxes className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#111827]">IMS</span>
          </div>

          {/* Center: Desktop Pill Nav */}
          <nav aria-label="Main navigation" className="hidden md:block">
            <div className="bg-white border border-[#E5E7EB] rounded-full px-1.5 py-1 shadow-card flex items-center gap-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy text-white'
                      : 'text-[#374151] hover:text-navy hover:bg-table-alt'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/theme-settings"
                className={({ isActive }) =>
                  `whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy text-white'
                      : 'text-[#374151] hover:text-navy hover:bg-table-alt'
                  }`
                }
              >
                Theme Settings
              </NavLink>
            </div>
          </nav>

          {/* Right: Desktop Profile Avatar Menu */}
          <div className="hidden md:block relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full pl-1.5 pr-3 py-1 shadow-card hover:bg-table-alt transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-icon-chip text-navy text-xs font-semibold flex items-center justify-center">
                {getInitials(user.fullName)}
              </span>
              <span className="text-sm font-medium text-[#111827] max-w-[140px] truncate">
                {user.fullName}
              </span>
              <ChevronDown className="w-4 h-4 text-[#6B7280]" aria-hidden="true" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 bg-white border border-[#E5E7EB] rounded-2xl shadow-card py-2 z-40"
              >
                <div className="px-4 py-2.5 border-b border-[#E5E7EB]">
                  <p className="text-sm font-semibold text-[#111827] truncate">{user.fullName}</p>
                  <p className="text-xs text-[#6B7280] truncate">{user.email || `@${user.username}`}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-icon-chip text-navy">
                    {user.roleName}
                  </span>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-table-alt transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Mobile Hamburger Menu Trigger */}
          <button
            type="button"
            onClick={() => void openDrawer()}
            aria-label="Open navigation menu"
            aria-expanded={drawerOpen}
            aria-controls="mobile-nav-drawer"
            className="md:hidden w-11 h-11 rounded-xl bg-white border border-[#E5E7EB] shadow-card text-[#111827] hover:bg-table-alt hover:text-navy flex items-center justify-center transition-colors shrink-0"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer (< 768px) */}
      <dialog
        ref={drawerRef}
        id="mobile-nav-drawer"
        aria-label="Navigation menu"
        className="ims-drawer md:hidden"
      >
        <div ref={scrollerRef} className="ims-drawer-scroller">
          <nav
            ref={sheetRef}
            aria-label="Mobile navigation"
            className="ims-drawer-sheet bg-white border-r border-[#E5E7EB] text-[#374151] shadow-xl"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-navy flex items-center justify-center shadow-card">
                  <Boxes className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <span className="text-base font-bold tracking-tight text-[#111827]">IMS</span>
              </div>
              <button
                type="button"
                autoFocus
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-[#6B7280] hover:bg-[#F5F6FA] hover:text-[#111827] transition-colors shrink-0"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="min-h-0 flex flex-col justify-between p-4 gap-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Signed-in User Summary */}
                <div className="bg-[#F5F6FA] border border-[#E5E7EB] rounded-xl p-3 flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-icon-chip text-navy text-xs font-semibold flex items-center justify-center shrink-0">
                    {getInitials(user.fullName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827] truncate">{user.fullName}</p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {user.email || `@${user.username}`}
                    </p>
                    <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-icon-chip text-navy">
                      {user.roleName}
                    </span>
                  </div>
                </div>

                {/* Mobile Nav Links */}
                <ul className="space-y-1.5">
                  <li>
                    <NavLink
                      to="/dashboard"
                      onClick={closeDrawer}
                      className={({ isActive }) =>
                        `min-h-[44px] w-full rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-navy text-white shadow-card'
                            : 'text-[#374151] hover:bg-table-alt hover:text-navy'
                        }`
                      }
                    >
                      <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Dashboard</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/theme-settings"
                      onClick={closeDrawer}
                      className={({ isActive }) =>
                        `min-h-[44px] w-full rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-navy text-white shadow-card'
                            : 'text-[#374151] hover:bg-table-alt hover:text-navy'
                        }`
                      }
                    >
                      <Palette className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Theme Settings</span>
                    </NavLink>
                  </li>
                </ul>
              </div>

              {/* Drawer Footer Logout */}
              <div className="pt-3 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    void logout();
                  }}
                  className="min-h-[44px] w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-[#DC2626] hover:bg-[#FFF1F2] transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </dialog>

      {/* Main Shell */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-3 sm:px-6 py-4 md:py-6 flex gap-6">
        {/* Thin Vertical Icon Sidebar */}
        <aside className="hidden md:flex flex-col items-center justify-between w-14 shrink-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-card py-4 self-start sticky top-24 min-h-[420px]">
          <div className="flex flex-col items-center gap-3">
            <NavLink
              to="/dashboard"
              title="Dashboard & Users"
              aria-label="Dashboard & Users"
              className={({ isActive }) =>
                `w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-navy text-white shadow-card'
                    : 'text-[#6B7280] hover:bg-icon-chip hover:text-navy'
                }`
              }
            >
              <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
            </NavLink>
            <NavLink
              to="/theme-settings"
              title="Theme Settings"
              aria-label="Theme Settings"
              className={({ isActive }) =>
                `w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isActive
                    ? 'bg-navy text-white shadow-card'
                    : 'text-[#6B7280] hover:bg-icon-chip hover:text-navy'
                }`
              }
            >
              <Palette className="w-5 h-5" aria-hidden="true" />
            </NavLink>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            title="Logout"
            aria-label="Logout"
            className="w-10 h-10 rounded-full text-[#6B7280] hover:bg-icon-chip hover:text-navy flex items-center justify-center transition-colors"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </aside>

        {/* Page Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
