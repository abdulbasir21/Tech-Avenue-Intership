import { Boxes, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';

export function WelcomePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-[#E5E7EB] px-3 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center">
              <Boxes className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-lg font-bold text-[#111827]">IMS</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-icon-chip text-navy text-xs font-semibold flex items-center justify-center shrink-0">
                {getInitials(user.fullName)}
              </span>
              <span className="hidden sm:inline text-sm font-medium text-[#111827]">
                {user.fullName}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 md:py-1.5 min-h-[44px] md:min-h-0 text-xs font-medium text-[#374151] hover:bg-[#F5F6FA] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Centered Welcome Card */}
      <main className="flex-1 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg bg-white border border-[#E5E7EB] rounded-2xl shadow-card p-5 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-icon-chip text-navy flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" aria-hidden="true" />
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-[#111827] break-words">
            Welcome, {user.fullName}
          </h1>

          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-icon-chip text-navy">
              {user.roleName}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#E8F7EE] text-[#16A34A]">
              Active
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-[#F5F6FA] p-4 text-left space-y-1.5 text-xs text-[#374151]">
            <p>
              <span className="text-[#6B7280]">Username:</span>{' '}
              <span className="font-medium text-[#111827] break-all">@{user.username}</span>
            </p>
            <p>
              <span className="text-[#6B7280]">Email:</span>{' '}
              <span className="font-medium text-[#111827] break-all">{user.email || '—'}</span>
            </p>
            <p>
              <span className="text-[#6B7280]">Department:</span>{' '}
              <span className="font-medium text-[#111827] break-words">{user.department}</span>
            </p>
          </div>

          <p className="text-xs text-[#6B7280] mt-5">
            Your account is active. Inventory workflow modules for your role will appear here once enabled.
          </p>

          <button
            type="button"
            onClick={() => void logout()}
            className="mt-6 w-full sm:w-auto min-h-[44px] md:min-h-0 inline-flex items-center justify-center gap-2 rounded-[10px] bg-navy hover:bg-navy-hover text-white text-sm font-medium px-6 py-2.5 transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </main>
    </div>
  );
}
