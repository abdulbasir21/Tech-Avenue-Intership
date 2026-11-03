import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi, CreateAssetData } from '../api/assets.api';
import { usersApi } from '../api/users.api';
import { Asset, AssetKind, AssetStatus } from '../types';
import { useAuth } from '../auth/useAuth';
import { formatDate } from '../utils/date';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { AssetStatusBadge } from '../components/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Laptop, Plus, Search, UserPlus, UserMinus, Trash2, Edit2 } from 'lucide-react';

export const Assets: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEmployee = user?.role === 'employee';

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [assigningAsset, setAssigningAsset] = useState<Asset | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [modalError, setModalError] = useState('');

  // Form state for Create / Edit
  const [assetName, setAssetName] = useState('');
  const [assetKind, setAssetKind] = useState<AssetKind>('hardware');
  const [assetSerial, setAssetSerial] = useState('');
  const [assetStatus, setAssetStatus] = useState<AssetStatus>('available');
  const [assetPurchaseDate, setAssetPurchaseDate] = useState('');

  // 1. Fetch assets query
  const {
    data: assetsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assets', { q: searchTerm, status: statusFilter }],
    queryFn: () =>
      assetsApi.list({
        q: searchTerm || undefined,
        status: statusFilter || undefined,
        limit: 100,
      }),
  });

  // 2. Fetch users for assign dropdown (Admin only)
  const { data: usersData } = useQuery({
    queryKey: ['usersForAssign'],
    queryFn: () => usersApi.list({ limit: 100 }),
    enabled: isAdmin,
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateAssetData) => assetsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error?.message || 'Failed to create asset');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAssetData> }) =>
      assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setEditingAsset(null);
      resetForm();
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error?.message || 'Failed to update asset');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => assetsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  // Assign Mutation
  const assignMutation = useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      assetsApi.assign(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      setAssigningAsset(null);
      setSelectedUserId('');
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error?.message || 'Failed to assign asset');
    },
  });

  // Unassign Mutation
  const unassignMutation = useMutation({
    mutationFn: (id: string) => assetsApi.unassign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });

  const resetForm = () => {
    setAssetName('');
    setAssetKind('hardware');
    setAssetSerial('');
    setAssetStatus('available');
    setAssetPurchaseDate('');
    setModalError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setAssetName(asset.name);
    setAssetKind(asset.kind);
    setAssetSerial(asset.serialNumber || '');
    setAssetStatus(asset.status);
    setAssetPurchaseDate(asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '');
    setModalError('');
  };

  const handleSubmitCreateOrEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    const payload = {
      name: assetName,
      kind: assetKind,
      serialNumber: assetSerial || undefined,
      status: assetStatus,
      purchaseDate: assetPurchaseDate || undefined,
    };

    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete asset "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenAssign = (asset: Asset) => {
    setAssigningAsset(asset);
    setSelectedUserId(asset.assignedTo?._id || '');
    setModalError('');
  };

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningAsset || !selectedUserId) return;
    assignMutation.mutate({ id: assigningAsset._id, userId: selectedUserId });
  };

  const handleUnassign = (asset: Asset) => {
    if (window.confirm(`Unassign "${asset.name}" from ${asset.assignedTo?.name}?`)) {
      unassignMutation.mutate(asset._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const assets = assetsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IT Asset Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEmployee
              ? 'View all company equipment and software licenses assigned to your profile.'
              : 'Track hardware laptops, monitors, accessories, and digital software keys across teams.'}
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 self-start">
            <Plus className="w-4 h-4" />
            <span>Add Asset</span>
          </Button>
        )}
      </div>

      {error && <ErrorMessage message="Failed to load assets." onRetry={() => refetch()} />}

      {/* Search and Filters Bar (Managers & Admins) */}
      {!isEmployee && (
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by serial number, license key, or item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-44"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="in_repair">In Repair</option>
            </select>
          </div>
        </div>
      )}

      {/* Assets Table */}
      {assets.length > 0 ? (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Asset Details</TableHeaderCell>
              <TableHeaderCell>Kind</TableHeaderCell>
              <TableHeaderCell>Serial / License</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Assigned To</TableHeaderCell>
              <TableHeaderCell>Purchased</TableHeaderCell>
              {isAdmin && <TableHeaderCell className="text-right">Actions</TableHeaderCell>}
            </tr>
          </TableHead>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset._id}>
                <TableCell>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-slate-400" />
                    <span>{asset.name}</span>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-xs font-medium text-slate-600">
                  {asset.kind}
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-700">
                  {asset.serialNumber || '—'}
                </TableCell>
                <TableCell>
                  <AssetStatusBadge status={asset.status} />
                </TableCell>
                <TableCell>
                  {asset.assignedTo ? (
                    <div>
                      <span className="font-medium text-slate-900 text-xs">
                        {asset.assignedTo.name}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        {asset.assignedTo.department}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Unassigned</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-slate-500">
                  {formatDate(asset.purchaseDate)}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {asset.status === 'in_use' ? (
                        <button
                          onClick={() => handleUnassign(asset)}
                          title="Unassign Asset"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenAssign(asset)}
                          disabled={asset.status === 'in_repair'}
                          title={
                            asset.status === 'in_repair'
                              ? 'Cannot assign asset in repair'
                              : 'Assign to User'
                          }
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEdit(asset)}
                        title="Edit Details"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(asset._id, asset.name)}
                        title="Delete Asset"
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          title="No Assets Found"
          description={
            searchTerm || statusFilter
              ? 'No assets matched your search query or status filter.'
              : 'There are currently no IT assets recorded in the system.'
          }
        />
      )}

      {/* Create / Edit Modal (Admin only) */}
      <Modal
        isOpen={isCreateModalOpen || !!editingAsset}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAsset(null);
          resetForm();
        }}
        title={editingAsset ? 'Edit IT Asset' : 'Add New IT Asset'}
      >
        <form onSubmit={handleSubmitCreateOrEdit} className="space-y-4">
          {modalError && <ErrorMessage message={modalError} />}

          <Input
            label="Asset / License Name"
            required
            placeholder="e.g., MacBook Pro 14 or JetBrains License"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kind</label>
              <select
                value={assetKind}
                onChange={(e) => setAssetKind(e.target.value as AssetKind)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={assetStatus}
                onChange={(e) => setAssetStatus(e.target.value as AssetStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="available">Available</option>
                <option value="in_use">In Use</option>
                <option value="in_repair">In Repair</option>
              </select>
            </div>
          </div>

          <Input
            label="Serial Number or License Key"
            placeholder="e.g., DL-5440-001 or LIC-JB-001"
            value={assetSerial}
            onChange={(e) => setAssetSerial(e.target.value)}
          />

          <Input
            label="Purchase Date"
            type="date"
            value={assetPurchaseDate}
            onChange={(e) => setAssetPurchaseDate(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingAsset(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingAsset ? 'Save Changes' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Asset Modal (Admin only) */}
      <Modal
        isOpen={!!assigningAsset}
        onClose={() => setAssigningAsset(null)}
        title="Assign Asset to Employee"
      >
        {assigningAsset && (
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            {modalError && <ErrorMessage message={modalError} />}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm">
              <p className="font-semibold text-slate-800">{assigningAsset.name}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Serial: {assigningAsset.serialNumber || 'N/A'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Select Employee
              </label>
              <select
                required
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Choose Employee --</option>
                {usersData?.data?.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email}) - {u.department} [{u.role}]
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setAssigningAsset(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={assignMutation.isPending} disabled={!selectedUserId}>
                Confirm Assignment
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
