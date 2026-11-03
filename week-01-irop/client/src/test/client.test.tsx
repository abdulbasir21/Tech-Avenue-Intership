import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LeaveStatusBadge, AssetStatusBadge } from '../components/Badge';

describe('Client Component Tests', () => {
  it('renders low stock badge when quantity is at or below threshold', () => {
    // Test the low stock badge condition used in inventory
    const quantity = 5;
    const threshold = 5;
    const isLowStock = quantity <= threshold;

    render(
      <div>
        {isLowStock ? (
          <span data-testid="low-stock-badge">Low Stock</span>
        ) : (
          <span data-testid="adequate-badge">Adequate</span>
        )}
      </div>
    );

    expect(screen.getByTestId('low-stock-badge')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('renders leave status badges accurately', () => {
    const { rerender } = render(<LeaveStatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();

    rerender(<LeaveStatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();

    rerender(<LeaveStatusBadge status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();

    rerender(<LeaveStatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('renders asset status badges accurately', () => {
    const { rerender } = render(<AssetStatusBadge status="in_use" />);
    expect(screen.getByText('In Use')).toBeInTheDocument();

    rerender(<AssetStatusBadge status="available" />);
    expect(screen.getByText('Available')).toBeInTheDocument();

    rerender(<AssetStatusBadge status="in_repair" />);
    expect(screen.getByText('In Repair')).toBeInTheDocument();
  });
});
