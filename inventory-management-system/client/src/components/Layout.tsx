import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Boxes, ChevronDown, LayoutDashboard, LogOut, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col overflow-x-hidden">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#F5F6FA]/95 backdrop-blur-sm border-b border-[#E5E7EB]/60 px-3 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-2 md:gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-navy flex items-center justify-center shadow-card">
              <Boxes className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="text-base md:text-lg font-bold tracking-tight text-[#111827]">IMS</span>
          </div>

          {/* Center: Pill Nav */}
          <nav aria-label="Main navigation" className="min-w-0">
            <div className="bg-white border border-[#E5E7EB] rounded-full px-1 py-1 md:px-1.5 shadow-card flex items-center gap-0.5 md:gap-1">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `whitespace-nowrap px-2.5 py-1.5 md:px-4 rounded-full text-[11px] md:text-sm font-medium transition-colors ${
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
                  `whitespace-nowrap px-2.5 py-1.5 md:px-4 rounded-full text-[11px] md:text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-navy text-white'
                      : 'text-[#374151] hover:text-navy hover:bg-table-alt'
                  }`
                }
              >
                <span className="md:hidden">Theme</span>
                <span className="hidden md:inline">Theme Settings</span>
              </NavLink>
            </div>
          </nav>

          {/* Right: Profile Avatar Menu */}
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1.5 md:gap-2 bg-white border border-[#E5E7EB] rounded-full pl-1 pr-2 py-1 md:pl-1.5 md:pr-3 shadow-card hover:bg-table-alt transition-colors"
            >
              <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-icon-chip text-navy text-xs font-semibold flex items-center justify-center">
                {getInitials(user.fullName)}
              </span>
              <span className="hidden sm:inline text-sm font-medium text-[#111827] max-w-[140px] truncate">
                {user.fullName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#6B7280]" />
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
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Shell */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 flex gap-6">
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
              <LayoutDashboard className="w-5 h-5" />
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
              <Palette className="w-5 h-5" />
            </NavLink>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            title="Logout"
            aria-label="Logout"
            className="w-10 h-10 rounded-full text-[#6B7280] hover:bg-icon-chip hover:text-navy flex items-center justify-center transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </aside>

        {/* Page Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
