import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { createUserApi, updateUserApi } from '../api/users.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DepartmentOption, ManagedUser, RoleOption } from '../types/auth';

interface UserFormModalProps {
  open: boolean;
  editingUser: ManagedUser | null;
  roles: RoleOption[];
  departments: DepartmentOption[];
  onClose: () => void;
  onSuccess: () => void;
}

export function UserFormModal({
  open,
  editingUser,
  roles,
  departments,
  onClose,
  onSuccess,
}: UserFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { user: currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(editingUser);
  const isEditingSelf = Boolean(editingUser && currentUser && editingUser.id === currentUser.id);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (editingUser) {
        setFullName(editingUser.fullName);
        setEmail(editingUser.email || '');
        setUsername(editingUser.username);
        setPassword('');
        setRoleId(String(editingUser.roleId));
        setDepartmentId(String(editingUser.departmentId));
        setIsActive(editingUser.isActive);
      } else {
        setFullName('');
        setEmail('');
        setUsername('');
        setPassword('');
        const defaultRole = roles.find((r) => r.code === 'employee') || roles[0];
        setRoleId(defaultRole ? String(defaultRole.id) : '');
        setDepartmentId(departments[0] ? String(departments[0].id) : '');
        setIsActive(true);
      }
      setShowPassword(false);
      setFieldErrors({});
      setFormError('');
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }
  }, [open, editingUser, roles, departments]);

  const validateClient = (): boolean => {
    const errs: Record<string, string> = {};

    if (fullName.trim().length < 2) {
      errs.fullName = 'Full name must be at least 2 characters';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (username.trim().length < 3 || !/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      errs.username = 'Username must be at least 3 chars (letters, numbers, . _ -)';
    }
    if (!isEditing && password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    } else if (isEditing && password.length > 0 && password.length < 8) {
      errs.password = 'New password must be at least 8 characters';
    }
    if (!roleId) {
      errs.roleId = 'Please select a role';
    }
    if (!departmentId) {
      errs.departmentId = 'Please select a department';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validateClient()) return;

    setSubmitting(true);
    try {
      if (isEditing && editingUser) {
        await updateUserApi(editingUser.id, {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim(),
          ...(password.trim().length > 0 ? { password } : {}),
          roleId: Number(roleId),
          departmentId: Number(departmentId),
          isActive,
        });
        if (isEditingSelf) {
          await refreshUser();
        }
        showToast('success', 'User updated successfully');
      } else {
        await createUserApi({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          username: username.trim(),
          password,
          roleId: Number(roleId),
          departmentId: Number(departmentId),
        });
        showToast('success', 'User created successfully');
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors && typeof data.errors === 'object') {
        setFieldErrors(data.errors);
      }
      const message = data?.message || 'Unable to save user. Please try again.';
      setFormError(message);
      showToast('error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as Record<string, string>)}
      aria-labelledby="user-modal-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!submitting) onClose();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current && !submitting) {
          const rect = dialogRef.current.getBoundingClientRect();
          const inside =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;
          if (!inside) onClose();
        }
      }}
      className="w-[calc(100%-2rem)] max-w-lg max-h-[90dvh] rounded-2xl border border-[#E5E7EB] bg-white p-0 shadow-card overflow-hidden open:flex open:flex-col"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#E5E7EB] shrink-0">
        <div>
          <h2 id="user-modal-title" className="text-lg font-semibold text-[#111827]">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            {isEditing
              ? 'Update user profile details, role, or account status.'
              : 'Create an employee record and login credentials.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          aria-label="Close dialog"
          className="w-11 h-11 md:w-8 md:h-8 rounded-lg flex items-center justify-center text-[#6B7280] hover:bg-[#F5F6FA] hover:text-[#111827] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-6 space-y-4 overflow-y-auto">
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-[#DC2626]/30 bg-[#FFF1F2] px-3.5 py-2.5 text-xs text-[#DC2626]"
          >
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="user-full-name" className="block text-xs font-medium text-[#374151] mb-1">
              Full Name
            </label>
            <input
              id="user-full-name"
              type="text"
              autoFocus
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              aria-invalid={Boolean(fieldErrors.fullName)}
              placeholder="e.g. Sarah Wilson"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-navy"
            />
            {fieldErrors.fullName && (
              <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.fullName}</p>
            )}
          </div>

          <div>
            <label htmlFor="user-email" className="block text-xs font-medium text-[#374151] mb-1">
              Email Address
            </label>
            <input
              id="user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(fieldErrors.email)}
              placeholder="sarah@example.com"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-navy"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="user-username" className="block text-xs font-medium text-[#374151] mb-1">
              Username
            </label>
            <input
              id="user-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-invalid={Boolean(fieldErrors.username)}
              placeholder="sarah.wilson"
              className="w-full rounded-[10px] border border-[#E5E7EB] px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-navy"
            />
            {fieldErrors.username && (
              <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.username}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="user-password" className="block text-xs font-medium text-[#374151] mb-1">
              {isEditing ? 'Password (Optional)' : 'Password'}
            </label>
            <div className="relative">
              <input
                id="user-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                placeholder={isEditing ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
                className="w-full rounded-[10px] border border-[#E5E7EB] pl-3.5 pr-10 py-2 text-sm text-[#111827] focus:outline-none focus:border-navy"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#111827]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="user-role" className="block text-xs font-medium text-[#374151] mb-1">
              Role
            </label>
            <select
              id="user-role"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              disabled={isEditingSelf}
              aria-invalid={Boolean(fieldErrors.roleId)}
              className="w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-navy disabled:bg-[#F5F6FA] disabled:text-[#6B7280]"
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            {fieldErrors.roleId && (
              <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.roleId}</p>
            )}
          </div>

          <div>
            <label htmlFor="user-dept" className="block text-xs font-medium text-[#374151] mb-1">
              Department
            </label>
            <select
              id="user-dept"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              aria-invalid={Boolean(fieldErrors.departmentId)}
              className="w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-navy"
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {fieldErrors.departmentId && (
              <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.departmentId}</p>
            )}
          </div>

          {isEditing && (
            <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-[#E5E7EB] bg-[#F5F6FA] px-4 py-2.5">
              <div>
                <p className="text-sm font-medium text-[#111827]">Account Status</p>
                <p className="text-xs text-[#6B7280]">
                  {isEditingSelf
                    ? 'You cannot deactivate your own admin account.'
                    : 'Inactive users cannot sign in.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                disabled={isEditingSelf}
                onClick={() => setIsActive((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-60 ${
                  isActive
                    ? 'bg-[#E8F7EE] text-[#16A34A]'
                    : 'bg-[#FFF4E5] text-[#F59E0B]'
                }`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 sm:flex-initial min-h-[44px] md:min-h-0 px-4 py-2 rounded-[10px] border border-[#E5E7EB] bg-white text-sm font-medium text-[#374151] hover:bg-[#F5F6FA] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 sm:flex-initial min-h-[44px] md:min-h-0 px-5 py-2 rounded-[10px] bg-navy hover:bg-navy-hover text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
