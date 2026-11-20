import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { getDepartmentsApi, getRolesApi, getUsersApi } from '../api/users.api';
import { DeleteUserModal } from '../components/DeleteUserModal';
import { UserFormModal } from '../components/UserFormModal';
import { useAuth } from '../context/AuthContext';
import {
  DepartmentOption,
  ManagedUser,
  PaginationMeta,
  RoleOption,
} from '../types/auth';
import { formatDateDDMMYYYY, formatUserId, getInitials } from '../utils/format';

export function DashboardPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    const loadMeta = async () => {
      try {
        const [rolesData, deptsData] = await Promise.all([getRolesApi(), getDepartmentsApi()]);
        if (active) {
          setRoles(rolesData);
          setDepartments(deptsData);
        }
      } catch {
        // Handled by table fetch / interceptors
      }
    };
    void loadMeta();
    return () => {
      active = false;
    };
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await getUsersApi({
        search: debouncedSearch || undefined,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: 10,
      });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, page]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (target: ManagedUser) => {
    setEditingUser(target);
    setFormOpen(true);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#111827]">
            Welcome back, {currentUser?.fullName}!
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Manage users and access</p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#1E3A8A] hover:bg-[#172E6E] text-white text-sm font-medium px-4 py-2.5 shadow-card transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table Card */}
      <section className="bg-white border border-[#E5E7EB] rounded-2xl shadow-card overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-[#E5E7EB] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, email, or username..."
              aria-label="Search users"
              className="w-full rounded-[10px] border border-[#E5E7EB] pl-10 pr-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#1E3A8A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by role"
              className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
              aria-label="Filter by status"
              className="rounded-[10px] border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#374151] focus:outline-none focus:border-[#1E3A8A]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {error ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-[#DC2626]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="px-4 py-2 rounded-[10px] bg-[#1E3A8A] text-white text-sm font-medium hover:bg-[#172E6E]"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-white">
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-[#111827] whitespace-nowrap">
                    User ID
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-[#111827] whitespace-nowrap">
                    User
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-[#111827] whitespace-nowrap">
                    Email
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-[#111827] whitespace-nowrap">
                    Role
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-[#111827] whitespace-nowrap">
                    Joined Date
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-[#111827] whitespace-nowrap">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold text-[#111827] whitespace-nowrap text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="border-b border-[#E5E7EB]/60 even:bg-[#F7F9FF]">
                      <td className="px-5 py-4" colSpan={7}>
                        <div className="h-5 bg-[#E5E7EB]/60 rounded animate-pulse w-full" />
                      </td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-11 h-11 rounded-full bg-[#EAF0FF] text-[#1E3A8A] flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-medium text-[#111827]">No users found</p>
                        <p className="text-xs text-[#6B7280]">
                          {debouncedSearch || roleFilter !== 'all' || statusFilter !== 'all'
                            ? 'Try clearing your search or filters.'
                            : 'Create your first user to get started.'}
                        </p>
                        {(debouncedSearch || roleFilter !== 'all' || statusFilter !== 'all') && (
                          <button
                            type="button"
                            onClick={handleClearFilters}
                            className="mt-1 px-3.5 py-1.5 rounded-[8px] border border-[#E5E7EB] text-xs font-medium text-[#374151] hover:bg-[#F5F6FA]"
                          >
                            Clear Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = currentUser?.id === u.id;
                    return (
                      <tr
                        key={u.id}
                        className="bg-white even:bg-[#F7F9FF] border-b border-[#E5E7EB]/60 last:border-b-0 transition-colors"
                      >
                        <td className="px-5 py-3.5 text-xs font-medium text-[#374151] whitespace-nowrap">
                          {formatUserId(u.id)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#EAF0FF] text-[#1E3A8A] text-xs font-semibold flex items-center justify-center shrink-0">
                              {getInitials(u.fullName)}
                            </span>
                            <div>
                              <div className="text-sm font-medium text-[#111827]">{u.fullName}</div>
                              <div className="text-xs text-[#6B7280]">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                          {u.email || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                          {u.roleName}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                          {formatDateDDMMYYYY(u.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              u.isActive
                                ? 'bg-[#E8F7EE] text-[#16A34A]'
                                : 'bg-[#FFF4E5] text-[#F59E0B]'
                            }`}
                          >
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(u)}
                              aria-label={`Edit ${u.fullName}`}
                              title="Edit user"
                              className="p-1.5 rounded-lg text-[#374151] hover:bg-[#EAF0FF] hover:text-[#1E3A8A] transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              disabled={isSelf}
                              aria-label={`Delete ${u.fullName}`}
                              title={isSelf ? 'You cannot delete your own account' : 'Delete user'}
                              className="p-1.5 rounded-lg text-[#DC2626] hover:bg-[#FFF1F2] transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <p className="text-xs text-[#6B7280]">
            Showing <span className="font-medium text-[#111827]">{startItem}</span>–
            <span className="font-medium text-[#111827]">{endItem}</span> of{' '}
            <span className="font-medium text-[#111827]">{pagination.total}</span> users
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#374151] hover:bg-[#F5F6FA] disabled:opacity-45"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <span className="px-2.5 text-xs font-medium text-[#374151]">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#374151] hover:bg-[#F5F6FA] disabled:opacity-45"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      <UserFormModal
        open={formOpen}
        editingUser={editingUser}
        roles={roles}
        departments={departments}
        onClose={() => setFormOpen(false)}
        onSuccess={() => void fetchUsers()}
      />

      <DeleteUserModal
        open={Boolean(deletingUser)}
        user={deletingUser}
        onClose={() => setDeletingUser(null)}
        onSuccess={() => void fetchUsers()}
      />
    </div>
  );
}
