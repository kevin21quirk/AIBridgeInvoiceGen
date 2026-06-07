import React from 'react';
import { cn } from '@/lib/utils';
import { PaymentStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const statusConfig: Record<PaymentStatus, { variant: BadgeProps['variant']; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    sent: { variant: 'info', label: 'Sent' },
    viewed: { variant: 'info', label: 'Viewed' },
    overdue: { variant: 'danger', label: 'Overdue' },
    paid: { variant: 'success', label: 'Paid' },
    cancelled: { variant: 'default', label: 'Cancelled' },
  };
  
  const config = statusConfig[status];
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
};
