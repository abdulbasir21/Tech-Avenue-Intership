import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, CreateUserData, UpdateUserData } from '../api/users.api';
import { User, Role } from '../types';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Users as UsersIcon, Plus, Search, Edit2, KeyRound } from 'lucide-react';

export const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Create Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('employee');
  const [department, setDepartment] = useState('Engineering');
  const [managerId, setManagerId] = useState('');

  // Edit Quotas Form State
  const [editRole, setEditRole] = useState<Role>('employee');
  const [editDepartment, setEditDepartment] = useState('');
  const [editManagerId, setEditManagerId] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [casualTotal, setCasualTotal] = useState(10);
  const [sickTotal, setSickTotal] = useState(8);
  const [annualTotal, setAnnualTotal] = useState(14);
  const [wfhTotal, setWfhTotal] = useState(12);

  // Fetch Users Query
  const {
    data: usersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['users', { search: searchTerm, role: roleFilter }],
    queryFn: () =>
      usersApi.list({
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        limit: 100,
      }),
  });

  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUserData) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
      resetCreateForm();
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error?.message || 'Failed to create user');
    },
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserData }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error?.message || 'Failed to update user');
    },
  });

  // Reset Password Mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, pass }: { id: string; pass: string }) =>
      usersApi.resetPassword(id, pass),
    onSuccess: () => {
      setResetSuccess('Password has been reset successfully!');
      setTimeout(() => {
        setResettingUser(null);
        setNewPassword('');
        setResetSuccess('');
      }, 1500);
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error?.message || 'Failed to reset password');
    },
  });

  const resetCreateForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('employee');
    setDepartment('Engineering');
    setManagerId('');
    setModalError('');
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditDepartment(u.department);
    setEditManagerId(
      typeof u.managerId === 'object' && u.managerId !== null
        ? u.managerId._id
        : (u.managerId as string) || ''
    );
    setEditIsActive(u.isActive);
    setCasualTotal(u.quotas?.casual?.total ?? 10);
    setSickTotal(u.quotas?.sick?.total ?? 8);
    setAnnualTotal(u.quotas?.annual?.total ?? 14);
    setWfhTotal(u.quotas?.wfh?.total ?? 12);
    setModalError('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    createMutation.mutate({
      name,
      email,
      password,
      role,
      department,
      managerId: managerId || null,
    });
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setModalError('');

    updateMutation.mutate({
      id: editingUser._id,
      data: {
        role: editRole,
        department: editDepartment,
        managerId: editManagerId || null,
        isActive: editIsActive,
        quotas: {
          casual: { total: Number(casualTotal) },
          sick: { total: Number(sickTotal) },
          annual: { total: Number(annualTotal) },
          wfh: { total: Number(wfhTotal) },
        },
      },
    });
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setModalError('');
    resetPasswordMutation.mutate({ id: resettingUser._id, pass: newPassword });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const users = usersData?.data || [];
  const managers = users.filter((u) => u.role === 'manager');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Admin console: manage employee profiles, departments, managers, quotas, and account status.
          </p>
        </div>

        <Button
          onClick={() => {
            resetCreateForm();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Create User</span>
        </Button>
      </div>

      {error && <ErrorMessage message="Failed to load users." onRetry={() => refetch()} />}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
            Role:
          </span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-40"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="employee">Employee</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {users.length > 0 ? (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>User</TableHeaderCell>
              <TableHeaderCell>Role</TableHeaderCell>
              <TableHeaderCell>Department</TableHeaderCell>
              <TableHeaderCell>Manager</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Quotas (Used/Total)</TableHeaderCell>
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {users.map((u) => {
              const mgrName =
                typeof u.managerId === 'object' && u.managerId !== null
                  ? u.managerId.name
                  : null;

              return (
                <TableRow key={u._id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <UsersIcon className="w-4 h-4 text-slate-400" />
                      <span>{u.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 pl-6">{u.email}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : u.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    {u.department}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {mgrName ? mgrName : <span className="text-slate-400 italic">None</span>}
                  </TableCell>
                  <TableCell>
                    {u.isActive ? (
                      <Badge variant="green">Active</Badge>
                    ) : (
                      <Badge variant="red">Deactivated</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-[11px] text-slate-600 space-x-1.5 font-mono">
                      <span>C:{u.quotas?.casual?.used}/{u.quotas?.casual?.total}</span>
                      <span>S:{u.quotas?.sick?.used}/{u.quotas?.sick?.total}</span>
                      <span>A:{u.quotas?.annual?.used}/{u.quotas?.annual?.total}</span>
                      <span>W:{u.quotas?.wfh?.used}/{u.quotas?.wfh?.total}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        title="Edit User & Quotas"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setResettingUser(u);
                          setNewPassword('');
                          setModalError('');
                        }}
                        title="Reset Password"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title="No Users Found"
          description="No users matched your query or filter parameters."
        />
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User Account"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {modalError && <ErrorMessage message={modalError} />}

          <Input
            label="Full Name"
            required
            placeholder="e.g., Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Work Email"
            type="email"
            required
            placeholder="jane@irop.demo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Temporary Password"
            type="password"
            required
            helperText="Min 8 chars with uppercase, lowercase, number, special char"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <Input
              label="Department"
              required
              placeholder="e.g., Engineering"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />
          </div>

          {role === 'employee' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reporting Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- No Manager Assigned --</option>
                {managers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.department})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit User & Quota Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={`Edit Profile: ${editingUser?.name}`}
      >
        {editingUser && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            {modalError && <ErrorMessage message={modalError} />}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as Role)}
                  disabled={editingUser._id === currentUser?._id}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <Input
                label="Department"
                required
                value={editDepartment}
                onChange={(e) => setEditDepartment(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reporting Manager
              </label>
              <select
                value={editManagerId}
                onChange={(e) => setEditManagerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- None --</option>
                {managers
                  .filter((m) => m._id !== editingUser._id)
                  .map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.department})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActiveCheckbox"
                checked={editIsActive}
                disabled={editingUser._id === currentUser?._id}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              />
              <label htmlFor="isActiveCheckbox" className="text-sm font-medium text-slate-700">
                Account is Active (uncheck to deactivate access)
              </label>
            </div>

            {/* Quota Limits Editor */}
            <div className="pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Annual Quota Allowances (Total Days)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Casual Total"
                  type="number"
                  min={0}
                  value={casualTotal}
                  onChange={(e) => setCasualTotal(Number(e.target.value))}
                />
                <Input
                  label="Sick Total"
                  type="number"
                  min={0}
                  value={sickTotal}
                  onChange={(e) => setSickTotal(Number(e.target.value))}
                />
                <Input
                  label="Annual Total"
                  type="number"
                  min={0}
                  value={annualTotal}
                  onChange={(e) => setAnnualTotal(Number(e.target.value))}
                />
                <Input
                  label="WFH Total"
                  type="number"
                  min={0}
                  value={wfhTotal}
                  onChange={(e) => setWfhTotal(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        title={`Reset Password for ${resettingUser?.name}`}
      >
        <form onSubmit={handleResetSubmit} className="space-y-4">
          {modalError && <ErrorMessage message={modalError} />}
          {resetSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg font-medium">
              {resetSuccess}
            </div>
          )}

          <Input
            label="New Password"
            type="password"
            required
            helperText="At least 8 chars with uppercase, lowercase, number, and special character"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button type="button" variant="outline" onClick={() => setResettingUser(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={resetPasswordMutation.isPending}>
              Confirm Reset
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
