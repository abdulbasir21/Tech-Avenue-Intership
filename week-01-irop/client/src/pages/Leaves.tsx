import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesApi } from '../api/leaves.api';
import { LeaveType } from '../types';
import { countWeekdays, formatDate } from '../utils/date';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { LeaveStatusBadge } from '../components/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { CalendarPlus, Ban, CalendarDays } from 'lucide-react';

export const Leaves: React.FC = () => {
  const queryClient = useQueryClient();

  // Form state
  const [type, setType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // 1. Fetch Balances
  const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['leaveBalance'],
    queryFn: leavesApi.getBalance,
  });

  // 2. Fetch My Leaves
  const {
    data: leavesData,
    isLoading: isLoadingLeaves,
    error: leavesError,
    refetch,
  } = useQuery({
    queryKey: ['myLeaves'],
    queryFn: () => leavesApi.getMyLeaves({ limit: 50 }),
  });

  // Calculate weekdays for selected dates
  const calculatedDays = useMemo(() => {
    return countWeekdays(startDate, endDate);
  }, [startDate, endDate]);

  // Find remaining balance for the selected type
  const selectedBalance = useMemo(() => {
    const found = balanceData?.find((b) => b.type === type);
    return found ? found.remaining : 0;
  }, [balanceData, type]);

  // Is requested days greater than remaining balance?
  const isInsufficientBalance = calculatedDays > selectedBalance;

  // Apply Leave Mutation
  const applyMutation = useMutation({
    mutationFn: leavesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      setFormSuccess('Leave application submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      setFormError('');
      setTimeout(() => setFormSuccess(''), 4000);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.error?.message || 'Failed to apply for leave');
    },
  });

  // Cancel Leave Mutation
  const cancelMutation = useMutation({
    mutationFn: leavesApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (calculatedDays <= 0) {
      setFormError('Leave must cover at least 1 weekday (Monday to Friday).');
      return;
    }

    if (isInsufficientBalance) {
      setFormError(
        `Insufficient balance. You requested ${calculatedDays} days, but only have ${selectedBalance} remaining.`
      );
      return;
    }

    applyMutation.mutate({
      type,
      startDate,
      endDate,
      reason,
    });
  };

  const handleCancel = (leaveId: string) => {
    if (window.confirm('Are you sure you want to cancel this pending leave request?')) {
      cancelMutation.mutate(leaveId);
    }
  };

  if (isLoadingBalance || isLoadingLeaves) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Apply for time off, view your remaining quota, and check past request approvals.
        </p>
      </div>

      {/* Quota Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {balanceData?.map((q) => (
          <div
            key={q.type}
            className={`p-4 rounded-xl border transition cursor-pointer ${
              type === q.type
                ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
            onClick={() => setType(q.type)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                {q.type}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {q.remaining} Left
              </span>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{q.remaining}</p>
            <p className="text-xs text-slate-400 mt-0.5">Used: {q.used} / {q.total} total</p>
          </div>
        ))}
      </div>

      {/* Apply Leave Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <CalendarPlus className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-900">Apply for Time Off</h2>
        </div>

        {formError && <ErrorMessage message={formError} className="mb-4" />}
        {formSuccess && (
          <div className="p-4 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium">
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Leave Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LeaveType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="annual">Annual Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="wfh">Work From Home (WFH)</option>
              </select>
            </div>

            <Input
              label="Start Date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />

            <Input
              label="End Date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Dynamic Weekday Calculator & Balance Pre-validation */}
          {startDate && endDate && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm ${
                isInsufficientBalance
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
              }`}
            >
              <div>
                <span className="font-bold">Calculated Working Days:</span>{' '}
                <span className="font-extrabold text-base">{calculatedDays}</span>{' '}
                {calculatedDays === 1 ? 'weekday' : 'weekdays'} (weekends excluded)
              </div>
              <div>
                <span className="font-medium">Remaining {type.toUpperCase()} Balance:</span>{' '}
                <span className="font-bold">{selectedBalance} days</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason for Leave
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please provide details regarding your leave request..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              isLoading={applyMutation.isPending}
              disabled={isInsufficientBalance || calculatedDays <= 0}
            >
              Submit Application
            </Button>
          </div>
        </form>
      </div>

      {/* Leave History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
            <span>My Leave History</span>
          </h2>
        </div>

        {leavesError && (
          <ErrorMessage
            message="Failed to load your leave history."
            onRetry={() => refetch()}
          />
        )}

        {leavesData?.data && leavesData.data.length > 0 ? (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Working Days</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Review Note</TableHeaderCell>
                <TableHeaderCell className="text-right">Action</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {leavesData.data.map((leave) => (
                <TableRow key={leave._id}>
                  <TableCell className="font-semibold text-slate-900 capitalize">
                    {leave.type}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800">
                    {leave.days}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={leave.reason}>
                    {leave.reason}
                  </TableCell>
                  <TableCell>
                    <LeaveStatusBadge status={leave.status} />
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 italic max-w-xs truncate">
                    {leave.reviewNote || (leave.reviewedBy ? `Reviewed by ${leave.reviewedBy.name}` : '—')}
                  </TableCell>
                  <TableCell className="text-right">
                    {leave.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(leave._id)}
                        disabled={cancelMutation.isPending}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="No Leave History"
            description="You haven't submitted any leave requests yet. Use the form above to apply for time off."
          />
        )}
      </div>
    </div>
  );
};
