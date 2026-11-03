import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi, CreateInventoryData } from '../api/inventory.api';
import { InventoryItem } from '../types';
import { useAuth } from '../auth/useAuth';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../components/Table';
import { Spinner } from '../components/Spinner';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { Boxes, Plus, Minus, Trash2, Edit2, AlertCircle } from 'lucide-react';

export const Inventory: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [modalError, setModalError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [threshold, setThreshold] = useState(5);
  const [unit, setUnit] = useState('pcs');

  // Fetch Inventory Query
  const {
    data: inventoryData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.list({ limit: 100 }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInventoryData) => inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error?.message || 'Failed to create inventory item');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateInventoryData> }) =>
      inventoryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setEditingItem(null);
      resetForm();
    },
    onError: (err: any) => {
      setModalError(err.response?.data?.error?.message || 'Failed to update item');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => inventoryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  // Adjust Mutation (Quick +/- 1)
  const adjustMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: 1 | -1 }) =>
      inventoryApi.adjust(id, delta),
    onMutate: async ({ id, delta }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['inventory'] });
      const previous = queryClient.getQueryData<any>(['inventory']);

      // Optimistically update
      if (previous?.data) {
        queryClient.setQueryData(['inventory'], {
          ...previous,
          data: previous.data.map((item: InventoryItem) => {
            if (item._id === id) {
              const newQty = Math.max(0, item.quantity + delta);
              return {
                ...item,
                quantity: newQty,
                isLowStock: newQty <= item.threshold,
              };
            }
            return item;
          }),
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(['inventory'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const resetForm = () => {
    setName('');
    setCategory('');
    setQuantity(0);
    setThreshold(5);
    setUnit('pcs');
    setModalError('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity);
    setThreshold(item.threshold);
    setUnit(item.unit);
    setModalError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    const payload = {
      name,
      category,
      quantity: Number(quantity),
      threshold: Number(threshold),
      unit,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem._id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = inventoryData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Office Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAdmin
              ? 'Manage stock of office peripherals, cables, and stationery with quick +/- level adjustments.'
              : 'Read-only view of current office supplies and low-stock replenishment indicators.'}
          </p>
        </div>

        {isAdmin && (
          <Button onClick={handleOpenCreate} className="flex items-center gap-1.5 self-start">
            <Plus className="w-4 h-4" />
            <span>Add Inventory Item</span>
          </Button>
        )}
      </div>

      {error && <ErrorMessage message="Failed to load inventory." onRetry={() => refetch()} />}

      {/* Inventory Table */}
      {items.length > 0 ? (
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>Item & Category</TableHeaderCell>
              <TableHeaderCell>Current Quantity</TableHeaderCell>
              <TableHeaderCell>Alert Threshold</TableHeaderCell>
              <TableHeaderCell>Stock Status</TableHeaderCell>
              {isAdmin && <TableHeaderCell className="text-center">Quick Adjust</TableHeaderCell>}
              {isAdmin && <TableHeaderCell className="text-right">Actions</TableHeaderCell>}
            </tr>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id} className={item.isLowStock ? 'bg-rose-50/30' : ''}>
                <TableCell>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-slate-400" />
                    <span>{item.name}</span>
                  </div>
                  <span className="text-xs text-slate-400 pl-6">{item.category}</span>
                </TableCell>
                <TableCell>
                  <span className="font-bold text-base text-slate-900">{item.quantity}</span>{' '}
                  <span className="text-xs text-slate-500 font-medium">{item.unit}</span>
                </TableCell>
                <TableCell className="text-xs text-slate-600">
                  {item.threshold} {item.unit}
                </TableCell>
                <TableCell>
                  {item.isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Low Stock</span>
                    </span>
                  ) : (
                    <Badge variant="green">Adequate</Badge>
                  )}
                </TableCell>
                {isAdmin && (
                  <TableCell className="text-center">
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        onClick={() => adjustMutation.mutate({ id: item._id, delta: -1 })}
                        disabled={item.quantity <= 0 || adjustMutation.isPending}
                        title="Decrease by 1"
                        className="w-7 h-7 rounded-md bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => adjustMutation.mutate({ id: item._id, delta: 1 })}
                        disabled={adjustMutation.isPending}
                        title="Increase by 1"
                        className="w-7 h-7 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 flex items-center justify-center font-bold text-sm shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </TableCell>
                )}
                {isAdmin && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Item"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id, item.name)}
                        title="Delete Item"
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
          title="No Inventory Items Found"
          description="There are currently no office supply items recorded in the inventory catalog."
        />
      )}

      {/* Create / Edit Modal (Admin only) */}
      <Modal
        isOpen={isCreateModalOpen || !!editingItem}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingItem(null);
          resetForm();
        }}
        title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && <ErrorMessage message={modalError} />}

          <Input
            label="Item Name"
            required
            placeholder="e.g., HDMI Cable or Wireless Mouse"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Category"
            required
            placeholder="e.g., Cables, Peripherals, Stationery"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Quantity"
              type="number"
              min={0}
              required
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />

            <Input
              label="Alert Threshold"
              type="number"
              min={0}
              required
              helperText="Alerts when ≤ this value"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />

            <Input
              label="Unit"
              required
              placeholder="e.g., pcs, reams, packs"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingItem(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingItem ? 'Save Changes' : 'Create Item'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
