import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesApi } from '../api/leaves.api';
import { LeaveRequest } from '../types';
import { formatDate } from '../utils/date';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { LeaveStatusBadge } from '../components/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export const LeaveApprovals: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [actionError, setActionError] = useState('');

  // Fetch Team / Company Pending Leaves
  const {
    data: approvalsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['teamLeaves'],
    queryFn: () => leavesApi.getTeamLeaves({ limit: 50 }),
  });

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      leavesApi.approve(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamLeaves'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
      closeModal();
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || 'Failed to approve leave');
    },
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      leavesApi.reject(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamLeaves'] });
      closeModal();
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || 'Failed to reject leave');
    },
  });

  const openActionModal = (leave: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedLeave(leave);
    setActionType(action);
    setReviewNote('');
    setActionError('');
  };

  const closeModal = () => {
    setSelectedLeave(null);
    setActionType(null);
    setReviewNote('');
    setActionError('');
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeave || !actionType) return;

    if (actionType === 'approve') {
      approveMutation.mutate({ id: selectedLeave._id, note: reviewNote });
    } else {
      rejectMutation.mutate({ id: selectedLeave._id, note: reviewNote });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const leaves = approvalsData?.data || [];
  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const pastReviewedLeaves = leaves.filter((l) => l.status !== 'pending');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave Approvals Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          {user?.role === 'admin'
            ? 'Administrator oversight: review, approve, or reject leave requests across all departments.'
            : 'Team manager queue: approve or reject leave requests for your direct reports.'}
        </p>
      </div>

      {error && (
        <ErrorMessage
          message="Failed to load leave requests."
          onRetry={() => refetch()}
        />
      )}

      {/* Pending Leaves Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>Pending Requests Requiring Decision ({pendingLeaves.length})</span>
          </h2>
        </div>

        {pendingLeaves.length > 0 ? (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Days</TableHeaderCell>
                <TableHeaderCell>Reason</TableHeaderCell>
                <TableHeaderCell className="text-right">Decide</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {pendingLeaves.map((leave) => {
                const employee = typeof leave.userId === 'object' ? leave.userId : null;
                const isOwnLeave = employee?._id === user?._id;

                return (
                  <TableRow key={leave._id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{employee?.name || 'User'}</div>
                      <div className="text-xs text-slate-500">{employee?.department}</div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 capitalize">
                      {leave.type}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {leave.days} {leave.days === 1 ? 'day' : 'days'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 max-w-xs truncate" title={leave.reason}>
                      {leave.reason}
                    </TableCell>
                    <TableCell className="text-right">
                      {isOwnLeave ? (
                        <span className="text-xs text-slate-400 italic">Own request</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openActionModal(leave, 'approve')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => openActionModal(leave, 'reject')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition border border-rose-200"
                          >
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Approvals Queue is Clear"
            description="There are currently no pending leave requests awaiting your review."
          />
        )}
      </div>

      {/* Previously Reviewed History */}
      {pastReviewedLeaves.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Past Reviewed Requests</h2>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Employee</TableHeaderCell>
                <TableHeaderCell>Category</TableHeaderCell>
                <TableHeaderCell>Dates</TableHeaderCell>
                <TableHeaderCell>Days</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Reviewer & Note</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {pastReviewedLeaves.map((leave) => {
                const employee = typeof leave.userId === 'object' ? leave.userId : null;
                return (
                  <TableRow key={leave._id}>
                    <TableCell>
                      <span className="font-medium text-slate-900">{employee?.name}</span>
                      <span className="block text-xs text-slate-500">{employee?.department}</span>
                    </TableCell>
                    <TableCell className="capitalize text-xs font-medium text-slate-700">
                      {leave.type}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">{leave.days}</TableCell>
                    <TableCell>
                      <LeaveStatusBadge status={leave.status} />
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 italic max-w-sm truncate">
                      {leave.reviewNote ? `"${leave.reviewNote}"` : 'No note provided'}
                      {leave.reviewedBy && (
                        <span className="block not-italic text-[11px] text-slate-400">
                          By {leave.reviewedBy.name} on {formatDate(leave.reviewedAt)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Decision Modal */}
      <Modal
        isOpen={!!selectedLeave}
        onClose={closeModal}
        title={actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
      >
        {selectedLeave && (
          <form onSubmit={handleConfirmAction} className="space-y-4">
            {actionError && <ErrorMessage message={actionError} />}

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-sm text-slate-700 border border-slate-100">
              <p>
                <span className="font-semibold">Applicant:</span>{' '}
                {typeof selectedLeave.userId === 'object' ? selectedLeave.userId.name : 'User'}
              </p>
              <p>
                <span className="font-semibold">Duration:</span> {selectedLeave.days} weekdays (
                {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)})
              </p>
              <p>
                <span className="font-semibold">Reason:</span> {selectedLeave.reason}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Review Note {actionType === 'reject' && <span className="text-rose-500">*</span>}
              </label>
              <textarea
                rows={3}
                required={actionType === 'reject'}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={
                  actionType === 'approve'
                    ? 'Optional approval comments or instructions...'
                    : 'Please provide reason for rejection...'
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant={actionType === 'approve' ? 'primary' : 'danger'}
                isLoading={approveMutation.isPending || rejectMutation.isPending}
              >
                Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
