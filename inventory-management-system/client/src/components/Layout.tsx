import React, { useEffect, useRef, useState } from 'react';
import { Boxes, ChevronDown, LayoutDashboard, LogOut, Users } from 'lucide-react';
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
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-[#F5F6FA]/95 backdrop-blur-sm border-b border-[#E5E7EB]/60 px-4 sm:px-6 py-3">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A8A] flex items-center justify-center shadow-card">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#111827]">IMS</span>
          </div>

          {/* Center: Pill Nav */}
          <nav aria-label="Main navigation">
            <div className="bg-white border border-[#E5E7EB] rounded-full px-1.5 py-1 shadow-card flex items-center">
              <span className="px-4 py-1.5 rounded-full bg-[#1E3A8A] text-white text-xs sm:text-sm font-medium">
                Dashboard
              </span>
            </div>
          </nav>

          {/* Right: Profile Avatar Menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 bg-white border border-[#E5E7EB] rounded-full pl-1.5 pr-3 py-1 shadow-card hover:bg-[#F7F9FF] transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-[#EAF0FF] text-[#1E3A8A] text-xs font-semibold flex items-center justify-center">
                {getInitials(user.fullName)}
              </span>
              <span className="hidden sm:inline text-sm font-medium text-[#111827] max-w-[140px] truncate">
                {user.fullName}
              </span>
              <ChevronDown className="w-4 h-4 text-[#6B7280]" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-60 bg-white border border-[#E5E7EB] rounded-2xl shadow-card py-2 z-40"
              >
                <div className="px-4 py-2.5 border-b border-[#E5E7EB]">
                  <p className="text-sm font-semibold text-[#111827] truncate">{user.fullName}</p>
                  <p className="text-xs text-[#6B7280] truncate">{user.email || `@${user.username}`}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EAF0FF] text-[#1E3A8A]">
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
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#DC2626] hover:bg-[#F7F9FF] transition-colors text-left"
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
            <div
              title="Dashboard & Users"
              className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center shadow-card"
            >
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div
              title="User Directory"
              className="w-10 h-10 rounded-full bg-[#EAF0FF] text-[#1E3A8A] flex items-center justify-center"
            >
              <Users className="w-5 h-5" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void logout()}
            title="Logout"
            aria-label="Logout"
            className="w-10 h-10 rounded-full text-[#6B7280] hover:bg-[#EAF0FF] hover:text-[#1E3A8A] flex items-center justify-center transition-colors"
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
