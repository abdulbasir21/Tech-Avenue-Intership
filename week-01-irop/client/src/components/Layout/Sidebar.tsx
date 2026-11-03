import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Laptop,
  Boxes,
  Users,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['employee', 'manager', 'admin'],
    },
    {
      to: '/leaves',
      label: 'My Leaves',
      icon: CalendarDays,
      roles: ['employee', 'manager', 'admin'],
    },
    {
      to: '/approvals',
      label: 'Leave Approvals',
      icon: CheckSquare,
      roles: ['manager', 'admin'],
    },
    {
      to: '/assets',
      label: 'Assets',
      icon: Laptop,
      roles: ['employee', 'manager', 'admin'],
    },
    {
      to: '/inventory',
      label: 'Inventory',
      icon: Boxes,
      roles: ['manager', 'admin'],
    },
    {
      to: '/users',
      label: 'User Management',
      icon: Users,
      roles: ['admin'],
    },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800 bg-slate-950/40">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-white text-lg tracking-tight">IROP</span>
          <span className="block text-[10px] text-slate-400 font-medium tracking-wider uppercase">
            IT Resource Platform
          </span>
        </div>
      </div>

      {/* User Info Capsule */}
      <div className="px-4 py-4 border-b border-slate-800/60">
        <div className="bg-slate-800/60 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-sm border border-indigo-500/30">
            {user.name.charAt(0)}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
