'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, paymentStatusVariant } from '@/components/ui/status-badge';
import { CreditCard, Check } from 'lucide-react';

interface PaymentCardProps {
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  lateFeesApplied?: number;
  loading?: boolean;
}

export default function PaymentCard({
  amount,
  dueDate,
  status,
  lateFeesApplied = 0,
  loading = false,
}: PaymentCardProps) {
  const totalAmount = amount + lateFeesApplied;

  // Format date to readable format
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get current month name
  const getCurrentMonth = () => {
    return new Date().toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              Maintenance
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 rounded w-24"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={status === 'overdue' ? 'border-red-200 bg-red-50/50' : 'border-0 shadow-sm'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            Maintenance
          </CardTitle>
          <StatusBadge variant={paymentStatusVariant[status]} dot>
            {status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Due'}
          </StatusBadge>
        </div>
        <p className="text-sm text-gray-500">{getCurrentMonth()}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className={`text-3xl font-bold ${status === 'paid' ? 'text-green-600' : status === 'overdue' ? 'text-red-600' : 'text-primary'}`}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </p>
          {lateFeesApplied > 0 && (
            <p className="text-xs text-red-600 mt-1">
              Includes ₹{lateFeesApplied} late fee
            </p>
          )}
        </div>

        {status !== 'paid' && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Due Date</span>
            <span className={status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-700'}>
              {formatDate(dueDate)}
            </span>
          </div>
        )}

        {status === 'paid' ? (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Check className="w-4 h-4" />
            Payment completed
          </div>
        ) : (
          <Link href="/maintenance" className="block">
            <Button className="w-full" variant={status === 'overdue' ? 'destructive' : 'default'}>
              Pay Now
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
