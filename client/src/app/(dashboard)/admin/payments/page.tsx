'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, paymentStatusVariant } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ClipboardList } from 'lucide-react';

interface MaintenanceWithUser {
  _id: string;
  user_id: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  flat_no: string;
  month: number;
  year: number;
  amount: number;
  late_fee: number;
  total_amount: number;
  due_date: string;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue';
  razorpay_payment_id?: string;
}

interface Stats {
  month: number;
  year: number;
  byStatus: {
    paid: { count: number; totalAmount: number };
    pending: { count: number; totalAmount: number };
    overdue: { count: number; totalAmount: number };
  };
  totals: {
    totalFlats: number;
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
  };
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [maintenance, setMaintenance] = useState<MaintenanceWithUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    pages: 1,
    total: 0,
    limit: 20,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>(String(new Date().getMonth() + 1));
  const [yearFilter, setYearFilter] = useState<string>(String(new Date().getFullYear()));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', String(pagination.current));
      params.append('limit', String(pagination.limit));
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (monthFilter) params.append('month', monthFilter);
      if (yearFilter) params.append('year', yearFilter);

      const [maintenanceRes, statsRes] = await Promise.all([
        api.get(`/maintenance/all?${params.toString()}`),
        api.get(`/maintenance/stats?month=${monthFilter}&year=${yearFilter}`),
      ]);

      if (maintenanceRes.data.success) {
        setMaintenance(maintenanceRes.data.data);
        setPagination(maintenanceRes.data.pagination);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.limit, statusFilter, monthFilter, yearFilter, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGenerateMaintenance = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/maintenance/generate', {
        month: parseInt(monthFilter),
        year: parseInt(yearFilter),
      });

      if (res.data.success) {
        toast({
          title: 'Success',
          description: res.data.message,
        });
        setShowGenerateDialog(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error generating maintenance:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate maintenance records',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || 'Unknown';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const years = ['2024', '2025', '2026', '2027'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Payments</h1>
          <p className="text-gray-600 mt-1">View and manage maintenance payments</p>
        </div>
        {user?.role === 'manager' && (
          <Button onClick={() => setShowGenerateDialog(true)} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <ClipboardList className="w-4 h-4 mr-2" /> Generate Monthly
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-500">Total Flats</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totals.totalFlats}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-green-600">Collected</p>
                <p className="text-3xl font-bold text-green-600">{formatAmount(stats.totals.totalCollected)}</p>
                <p className="text-xs text-green-600">{stats.byStatus.paid.count} flats</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-amber-600">Pending</p>
                <p className="text-3xl font-bold text-amber-600">{formatAmount(stats.byStatus.pending.totalAmount)}</p>
                <p className="text-xs text-amber-600">{stats.byStatus.pending.count} flats</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-red-600">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{formatAmount(stats.byStatus.overdue.totalAmount)}</p>
                <p className="text-xs text-red-600">{stats.byStatus.overdue.count} flats</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-auto">
              <label className="text-sm text-gray-500 mb-1 block">Month</label>
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm text-gray-500 mb-1 block">Year</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="text-sm text-gray-500 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {getMonthName(parseInt(monthFilter))} {yearFilter} - Maintenance Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : maintenance.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No maintenance records found</p>
              {user?.role === 'manager' && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowGenerateDialog(true)}
                >
                  Generate Records
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Flat</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenance.map((m) => (
                    <TableRow key={m._id}>
                      <TableCell className="font-semibold">{m.flat_no}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{m.user_id?.name || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{m.user_id?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatAmount(m.total_amount)}</span>
                        {m.late_fee > 0 && (
                          <span className="text-xs text-red-600 block">
                            +{formatAmount(m.late_fee)} late fee
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(m.due_date)}</TableCell>
                      <TableCell>
                        <StatusBadge variant={paymentStatusVariant[m.status]} dot>
                          {m.status === 'paid' ? 'Paid' : m.status === 'overdue' ? 'Overdue' : 'Pending'}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {m.paid_date ? formatDate(m.paid_date) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Showing {(pagination.current - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.current * pagination.limit, pagination.total)} of{' '}
                    {pagination.total} records
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.current === 1}
                      onClick={() => setPagination((p) => ({ ...p, current: p.current - 1 }))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.current === pagination.pages}
                      onClick={() => setPagination((p) => ({ ...p, current: p.current + 1 }))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Monthly Maintenance</DialogTitle>
            <DialogDescription>
              This will create maintenance records for all registered flats for{' '}
              {getMonthName(parseInt(monthFilter))} {yearFilter}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              • Base amount: <strong>₹1,000</strong> per flat<br />
              • Due date: <strong>18th</strong> of the month<br />
              • Late fee: <strong>₹100</strong> after due date<br />
              • Existing records will be skipped
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateMaintenance} disabled={generating}>
              {generating ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
