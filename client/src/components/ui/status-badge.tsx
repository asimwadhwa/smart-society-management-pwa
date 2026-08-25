import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  variant?: StatusVariant;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  danger: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
};

const dotStyles: Record<StatusVariant, string> = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  default: 'bg-gray-500',
};

const sizeStyles = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function StatusBadge({
  variant = 'default',
  children,
  className,
  size = 'md',
  dot = false,
}: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium border rounded-full inline-flex items-center gap-1.5',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', dotStyles[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </Badge>
  );
}

// Common status mappings for convenience
export const paymentStatusVariant: Record<string, StatusVariant> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  partial: 'info',
};

export const complaintStatusVariant: Record<string, StatusVariant> = {
  open: 'warning',
  'in-progress': 'info',
  resolved: 'success',
  closed: 'default',
};

export const userStatusVariant: Record<string, StatusVariant> = {
  active: 'success',
  inactive: 'default',
  pending: 'warning',
};
