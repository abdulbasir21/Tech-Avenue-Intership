import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { deleteUserApi, updateUserApi } from '../api/users.api';
import { useToast } from '../context/ToastContext';
import { ManagedUser } from '../types/auth';

interface DeleteUserModalProps {
  open: boolean;
  user: ManagedUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteUserModal({ open, user, onClose, onSuccess }: DeleteUserModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { showToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [restrictedMessage, setRestrictedMessage] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      setRestrictedMessage(null);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleDelete = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await deleteUserApi(user.id);
      showToast('success', `User "${user.fullName}" deleted successfully`);
      onSuccess();
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      if (err?.response?.status === 409 && data?.code === 'DELETE_RESTRICTED') {
        setRestrictedMessage(
          data.message ||
            'This user cannot be deleted because related history records exist. Please deactivate the account instead.'
        );
      } else {
        const message = data?.message || 'Failed to delete user';
        showToast('error', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await updateUserApi(user.id, { isActive: false });
      showToast('success', `User "${user.fullName}" deactivated`);
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to deactivate user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby="delete-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!submitting) onClose();
      }}
      className="w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] max-w-md max-h-[90dvh] rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-card overflow-hidden open:flex open:flex-col"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E5E7EB] shrink-0">
        <h2 id="delete-modal-title" className="text-lg font-semibold text-[#111827]">
          Delete User
        </h2>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close dialog"
          className="w-11 h-11 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F5F6FA] hover:text-[#111827]"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
        {restrictedMessage ? (
          <div className="rounded-xl border border-[#F59E0B]/40 bg-[#FFF4E5] p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#111827]">Deletion Blocked by History</p>
              <p className="text-xs text-[#374151] leading-relaxed">{restrictedMessage}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#374151] leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-[#111827]">{user?.fullName}</span> (
            <span className="text-[#6B7280]">@{user?.username}</span>)? This permanently removes
            their login and employee record if no history exists.
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 pt-2">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto min-h-[44px] md:min-h-0 px-4 py-2 rounded-[10px] border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F5F6FA]"
          >
            Cancel
          </button>

          {restrictedMessage ? (
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={submitting || !user?.isActive}
              className="w-full sm:w-auto min-h-[44px] md:min-h-0 px-4 py-2 rounded-[10px] bg-navy hover:bg-navy-hover text-white text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Deactivating...' : 'Deactivate User Instead'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="w-full sm:w-auto min-h-[44px] md:min-h-0 px-4 py-2 rounded-[10px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-sm font-medium disabled:opacity-60"
            >
              {submitting ? 'Deleting...' : 'Delete User'}
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
