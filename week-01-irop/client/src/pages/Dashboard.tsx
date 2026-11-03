import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/useAuth';
import { leavesApi } from '../api/leaves.api';
import { assetsApi } from '../api/assets.api';
import { inventoryApi } from '../api/inventory.api';
import { usersApi } from '../api/users.api';
import { Spinner } from '../components/Spinner';
import { LeaveStatusBadge, AssetStatusBadge } from '../components/Badge';
import { formatDate } from '../utils/date';
import {
  CalendarDays,
  Laptop,
  Users as UsersIcon,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // 1. Quota balance query (for all roles)
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['leaveBalance'],
    queryFn: leavesApi.getBalance,
    enabled: !!user,
  });

  // 2. My pending leaves
  const { data: myLeavesData } = useQuery({
    queryKey: ['myLeaves', { limit: 5 }],
    queryFn: () => leavesApi.getMyLeaves({ limit: 5 }),
    enabled: !!user,
  });

  // 3. My assets
  const { data: myAssetsData } = useQuery({
    queryKey: ['myAssets'],
    queryFn: assetsApi.getMyAssets,
    enabled: !!user,
  });

  // 4. Team pending leaves (for manager & admin)
  const { data: teamLeavesData } = useQuery({
    queryKey: ['teamLeaves', { status: 'pending' }],
    queryFn: () => leavesApi.getTeamLeaves({ status: 'pending', limit: 5 }),
    enabled: !!user && (user.role === 'manager' || user.role === 'admin'),
  });

  // 5. Admin global counts
  const { data: allUsersData } = useQuery({
    queryKey: ['adminUsersCount'],
    queryFn: () => usersApi.list({ limit: 1 }),
    enabled: !!user && user.role === 'admin',
  });

  const { data: allAssetsData } = useQuery({
    queryKey: ['adminAssetsStats'],
    queryFn: () => assetsApi.list({ limit: 100 }),
    enabled: !!user && (user.role === 'admin' || user.role === 'manager'),
  });

  const { data: allInventoryData } = useQuery({
    queryKey: ['adminInventoryStats'],
    queryFn: () => inventoryApi.list({ limit: 100 }),
    enabled: !!user && (user.role === 'admin' || user.role === 'manager'),
  });

  if (!user || isLoadingBalance) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Calculate admin/manager stats
  const totalUsers = allUsersData?.pagination.total || 0;
  const pendingApprovalsCount = teamLeavesData?.pagination.total || 0;

  const assets = allAssetsData?.data || [];
  const assetsInUse = assets.filter((a) => a.status === 'in_use').length;
  const assetsAvailable = assets.filter((a) => a.status === 'available').length;

  const inventoryItems = allInventoryData?.data || [];
  const lowStockCount = inventoryItems.filter((i) => i.isLowStock).length;

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 lg:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="inline-block px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-2">
            {user.role} workspace
          </span>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
            Welcome back, {user.name}
          </h1>
          <p className="text-slate-300 text-sm mt-1">
            Department of {user.department} • Manage your operations, assets, and schedule.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/leaves"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-sm"
          >
            Apply for Leave
          </Link>
          {(user.role === 'manager' || user.role === 'admin') && (
            <Link
              to="/approvals"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm border border-slate-700 transition"
            >
              Review Approvals ({pendingApprovalsCount})
            </Link>
          )}
        </div>
      </div>

      {/* Admin / Manager Top Stats Cards */}
      {(user.role === 'admin' || user.role === 'manager') && (
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>Operations Overview</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {user.role === 'admin' && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{totalUsers}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <UsersIcon className="w-6 h-6" />
                </div>
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leaves</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{pendingApprovalsCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assets In Use / Avail</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {assetsInUse} <span className="text-sm font-normal text-slate-400">/ {assetsAvailable}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Laptop className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</p>
                <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                  {lowStockCount}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quota Tracker (Total, Used, Remaining) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-800">My Leave Quota Tracker</h2>
          <Link to="/leaves" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <span>Apply or View History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balanceData?.map((q) => {
            const percentage = q.total > 0 ? Math.round((q.used / q.total) * 100) : 0;
            return (
              <div
                key={q.type}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {q.type} Leave
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {q.remaining} Left
                  </span>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-3xl font-extrabold text-slate-900">{q.remaining}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {q.total} days</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{q.used} used</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      percentage > 80
                        ? 'bg-rose-500'
                        : percentage > 50
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dual Section: My Recent Leaves & My Assigned Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* My Recent Leaves */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <span>My Recent Leave Requests</span>
            </h3>
            <Link to="/leaves" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {myLeavesData?.data && myLeavesData.data.length > 0 ? (
              myLeavesData.data.slice(0, 4).map((l) => (
                <div key={l._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 capitalize">{l.type} Leave</span>
                      <span className="text-xs text-slate-400">({l.days} {l.days === 1 ? 'weekday' : 'weekdays'})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(l.startDate)} - {formatDate(l.endDate)}
                    </p>
                  </div>
                  <LeaveStatusBadge status={l.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No recent leave requests found.</p>
            )}
          </div>
        </div>

        {/* My Assigned Assets */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-indigo-600" />
              <span>My Assigned Assets</span>
            </h3>
            <Link to="/assets" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {myAssetsData && myAssetsData.length > 0 ? (
              myAssetsData.map((asset) => (
                <div key={asset._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-slate-900">{asset.name}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {asset.serialNumber || 'No Serial / Digital License'}
                    </p>
                  </div>
                  <AssetStatusBadge status={asset.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-6 text-center">No assets currently assigned to you.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
