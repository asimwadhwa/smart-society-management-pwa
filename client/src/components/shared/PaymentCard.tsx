'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from './StatusBadge';
import { CreditCard } from 'lucide-react';

interface PaymentCardProps {
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  onPayClick?: () => void;
}

export default function PaymentCard({ amount, dueDate, status, onPayClick }: PaymentCardProps) {
  const statusConfig = {
    paid: { label: 'Paid', variant: 'success' as const },
    pending: { label: 'Pending', variant: 'warning' as const },
    overdue: { label: 'Overdue', variant: 'danger' as const },
  };

  const config = statusConfig[status];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" /> Maintenance Due
          </CardTitle>
          <StatusBadge status={config.variant}>{config.label}</StatusBadge>
        </div>
        <CardDescription>Due: {dueDate}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-gray-900">₹{amount.toLocaleString()}</p>
      </CardContent>
      {status !== 'paid' && onPayClick && (
        <CardFooter>
          <Button onClick={onPayClick} className="w-full">
            Pay Now
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
