import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'amber' | 'green' | 'red' | 'gray' | 'blue' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  className = '',
}) => {
  const variantClasses = {
    amber: 'bg-amber-100 text-amber-800 border border-amber-200',
    green: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    red: 'bg-rose-100 text-rose-800 border border-rose-200',
    gray: 'bg-slate-100 text-slate-800 border border-slate-200',
    blue: 'bg-sky-100 text-sky-800 border border-sky-200',
    purple: 'bg-purple-100 text-purple-800 border border-purple-200',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full capitalize font-medium ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const LeaveStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="amber">Pending</Badge>;
    case 'approved':
      return <Badge variant="green">Approved</Badge>;
    case 'rejected':
      return <Badge variant="red">Rejected</Badge>;
    case 'cancelled':
      return <Badge variant="gray">Cancelled</Badge>;
    default:
      return <Badge variant="gray">{status}</Badge>;
  }
};

export const AssetStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'in_use':
      return <Badge variant="blue">In Use</Badge>;
    case 'available':
      return <Badge variant="green">Available</Badge>;
    case 'in_repair':
      return <Badge variant="amber">In Repair</Badge>;
    default:
      return <Badge variant="gray">{status}</Badge>;
  }
};
