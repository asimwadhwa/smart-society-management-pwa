'use client';

import {
  useEffect,
  useState,
  useCallback,
} from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import {
  StatusBadge,
  paymentStatusVariant,
} from '@/components/ui/status-badge';

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

interface Society {
  _id: string;
  name: string;
  society_code: string;
  city?: string;
  state?: string;
  is_active?: boolean;
}

interface MaintenanceWithUser {
  _id: string;

  society_id:
    | string
    | {
        _id: string;
        name: string;
        society_code: string;
        city?: string;
        state?: string;
      };

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

  status:
    | 'pending'
    | 'paid'
    | 'overdue';

  razorpay_payment_id?: string;
}

interface Stats {
  month: number;
  year: number;

  society_id?: string | null;
  all_societies?: boolean;

  byStatus: {
    paid: {
      count: number;
      totalAmount: number;
    };

    pending: {
      count: number;
      totalAmount: number;
    };

    overdue: {
      count: number;
      totalAmount: number;
    };
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

  const isSuperAdmin =
    user?.role === 'super_admin';

  const [maintenance, setMaintenance] =
    useState<MaintenanceWithUser[]>([]);

  const [stats, setStats] =
    useState<Stats | null>(null);

  const [societies, setSocieties] =
    useState<Society[]>([]);

  const [selectedSociety, setSelectedSociety] =
    useState<string>('all');

  const [loading, setLoading] =
    useState(true);

  const [loadingSocieties, setLoadingSocieties] =
    useState(false);

  const [generating, setGenerating] =
    useState(false);

  const [showGenerateDialog, setShowGenerateDialog] =
    useState(false);

  const [pagination, setPagination] =
    useState<Pagination>({
      current: 1,
      pages: 1,
      total: 0,
      limit: 20,
    });

  const [statusFilter, setStatusFilter] =
    useState<string>('all');

  const [monthFilter, setMonthFilter] =
    useState<string>(
      String(new Date().getMonth() + 1)
    );

  const [yearFilter, setYearFilter] =
    useState<string>(
      String(new Date().getFullYear())
    );

  // ==========================================================
  // LOAD SOCIETIES
  // ==========================================================

  const fetchSocieties = useCallback(
    async () => {
      if (!isSuperAdmin) {
        return;
      }

      try {
        setLoadingSocieties(true);

        const response =
          await api.get('/societies');

        if (response.data.success) {
          setSocieties(
            response.data.data || []
          );
        }
      } catch (error: any) {
        console.error(
          'Error fetching societies:',
          error
        );

        console.error(
          'Society API response:',
          error?.response?.data
        );

        toast({
          title: 'Error',
          description:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to load societies',
          variant: 'destructive',
        });
      } finally {
        setLoadingSocieties(false);
      }
    },
    [
      isSuperAdmin,
      toast,
    ]
  );

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSocieties();
    }
  }, [
    isSuperAdmin,
    fetchSocieties,
  ]);

  // ==========================================================
  // FETCH PAYMENT DATA
  // ==========================================================

  const fetchData = useCallback(
    async () => {
      try {
        setLoading(true);

        const params =
          new URLSearchParams();

        params.append(
          'page',
          String(pagination.current)
        );

        params.append(
          'limit',
          String(pagination.limit)
        );

        if (
          statusFilter !== 'all'
        ) {
          params.append(
            'status',
            statusFilter
          );
        }

        if (monthFilter) {
          params.append(
            'month',
            monthFilter
          );
        }

        if (yearFilter) {
          params.append(
            'year',
            yearFilter
          );
        }

        // Super Admin:
        // all societies OR selected society
        if (
          isSuperAdmin &&
          selectedSociety !== 'all'
        ) {
          params.append(
            'society_id',
            selectedSociety
          );
        }

        const statsParams =
          new URLSearchParams();

        statsParams.append(
          'month',
          monthFilter
        );

        statsParams.append(
          'year',
          yearFilter
        );

        if (
          isSuperAdmin &&
          selectedSociety !== 'all'
        ) {
          statsParams.append(
            'society_id',
            selectedSociety
          );
        }

        const [
          maintenanceRes,
          statsRes,
        ] = await Promise.all([
          api.get(
            `/maintenance/all?${params.toString()}`
          ),

          api.get(
            `/maintenance/stats?${statsParams.toString()}`
          ),
        ]);

        // ======================================================
        // MAINTENANCE RESPONSE
        // ======================================================

        if (
          maintenanceRes.data.success
        ) {
          setMaintenance(
            maintenanceRes.data.data || []
          );

          if (
            maintenanceRes.data.pagination
          ) {
            setPagination(
              maintenanceRes.data.pagination
            );
          }
        } else {
          throw new Error(
            maintenanceRes.data.message ||
              'Failed to load maintenance records'
          );
        }

        // ======================================================
        // STATS RESPONSE
        // ======================================================

        if (
          statsRes.data.success
        ) {
          setStats(
            statsRes.data.data
          );
        } else {
          throw new Error(
            statsRes.data.message ||
              'Failed to load payment statistics'
          );
        }

      } catch (error: any) {

        console.error(
          '===================================='
        );

        console.error(
          'PAYMENT PAGE ERROR'
        );

        console.error(
          '===================================='
        );

        console.error(
          'Error:',
          error
        );

        console.error(
          'API Response:',
          error?.response?.data
        );

        console.error(
          'API Status:',
          error?.response?.status
        );

        console.error(
          'API URL:',
          error?.config?.url
        );

        console.error(
          '===================================='
        );

        toast({
          title: 'Error',
          description:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to load payment data',
          variant: 'destructive',
        });

        setMaintenance([]);
        setStats(null);

      } finally {
        setLoading(false);
      }
    },
    [
      pagination.current,
      pagination.limit,
      statusFilter,
      monthFilter,
      yearFilter,
      isSuperAdmin,
      selectedSociety,
      toast,
    ]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==========================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ==========================================================

  useEffect(() => {
    setPagination((previous) => ({
      ...previous,
      current: 1,
    }));
  }, [
    statusFilter,
    monthFilter,
    yearFilter,
    selectedSociety,
  ]);

  // ==========================================================
  // GENERATE MAINTENANCE
  // MANAGER ONLY
  // ==========================================================

  const handleGenerateMaintenance =
    async () => {
      try {
        setGenerating(true);

        const res =
          await api.post(
            '/maintenance/generate',
            {
              month:
                parseInt(monthFilter),

              year:
                parseInt(yearFilter),
            }
          );

        if (
          res.data.success
        ) {
          toast({
            title: 'Success',
            description:
              res.data.message,
          });

          setShowGenerateDialog(
            false
          );

          fetchData();
        } else {
          throw new Error(
            res.data.message ||
              'Failed to generate maintenance records'
          );
        }

      } catch (error: any) {

        console.error(
          'Error generating maintenance:',
          error
        );

        console.error(
          'Generate API response:',
          error?.response?.data
        );

        toast({
          title: 'Error',
          description:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to generate maintenance records',
          variant: 'destructive',
        });

      } finally {
        setGenerating(false);
      }
    };

  // ==========================================================
  // HELPERS
  // ==========================================================

  const getMonthName = (
    month: number
  ) => {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    return (
      months[month - 1] ||
      'Unknown'
    );
  };

  const formatDate = (
    dateStr: string
  ) => {
    return new Date(
      dateStr
    ).toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const formatAmount = (
    amount: number
  ) => {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
      }
    ).format(amount);
  };

  const getSocietyName = (
    record: MaintenanceWithUser
  ) => {
    if (
      typeof record.society_id ===
        'object' &&
      record.society_id
    ) {
      return (
        record.society_id.name ||
        'Unknown Society'
      );
    }

    const society =
      societies.find(
        (item) =>
          item._id ===
          record.society_id
      );

    return (
      society?.name ||
      'Unknown Society'
    );
  };

  const getSocietyCode = (
    record: MaintenanceWithUser
  ) => {
    if (
      typeof record.society_id ===
        'object' &&
      record.society_id
    ) {
      return (
        record.society_id
          .society_code || ''
      );
    }

    const society =
      societies.find(
        (item) =>
          item._id ===
          record.society_id
      );

    return (
      society?.society_code || ''
    );
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

  const years = [
    '2024',
    '2025',
    '2026',
    '2027',
  ];

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-5 sm:space-y-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-w-0">

        <div className="min-w-0">

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
            All Payments
          </h1>

          <p className="text-sm sm:text-base text-gray-600 mt-1">
            View and manage maintenance payments
          </p>

        </div>

        {user?.role === 'manager' && (
          <Button
            onClick={() =>
              setShowGenerateDialog(true)
            }
            className="w-full sm:w-auto flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Generate Monthly
          </Button>
        )}

      </div>

      {/* SUPER ADMIN SOCIETY FILTER */}

      {isSuperAdmin && (
        <Card className="min-w-0">

          <CardContent className="p-4 sm:pt-6">

            <div className="w-full sm:w-auto">

              <label className="text-sm text-gray-500 mb-1 block">
                Society
              </label>

              <Select
                value={selectedSociety}
                onValueChange={
                  setSelectedSociety
                }
              >

                <SelectTrigger className="w-full sm:w-[300px]">

                  <SelectValue
                    placeholder={
                      loadingSocieties
                        ? 'Loading societies...'
                        : 'All Societies'
                    }
                  />

                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="all">
                    All Societies
                  </SelectItem>

                  {societies.map(
                    (society) => (
                      <SelectItem
                        key={
                          society._id
                        }
                        value={
                          society._id
                        }
                      >
                        {society.name} (
                        {
                          society.society_code
                        }
                        )
                      </SelectItem>
                    )
                  )}

                </SelectContent>

              </Select>

            </div>

          </CardContent>

        </Card>
      )}

      {/* STATS CARDS */}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">

          {/* Total Flats */}

          <Card className="min-w-0">

            <CardContent className="p-4 sm:pt-6">

              <div className="text-center min-w-0">

                <p className="text-xs sm:text-sm text-gray-500">
                  Total Flats
                </p>

                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {
                    stats.totals
                      .totalFlats
                  }
                </p>

              </div>

            </CardContent>

          </Card>

          {/* Collected */}

          <Card className="bg-green-50 border-green-200 min-w-0">

            <CardContent className="p-4 sm:pt-6">

              <div className="text-center min-w-0">

                <p className="text-xs sm:text-sm text-green-600">
                  Collected
                </p>

                <p className="text-lg sm:text-3xl font-bold text-green-600 break-all">
                  {formatAmount(
                    stats.totals
                      .totalCollected
                  )}
                </p>

                <p className="text-xs text-green-600">
                  {
                    stats.byStatus
                      .paid.count
                  }{' '}
                  flats
                </p>

              </div>

            </CardContent>

          </Card>

          {/* Pending */}

          <Card className="bg-amber-50 border-amber-200 min-w-0">

            <CardContent className="p-4 sm:pt-6">

              <div className="text-center min-w-0">

                <p className="text-xs sm:text-sm text-amber-600">
                  Pending
                </p>

                <p className="text-lg sm:text-3xl font-bold text-amber-600 break-all">
                  {formatAmount(
                    stats.byStatus
                      .pending
                      .totalAmount
                  )}
                </p>

                <p className="text-xs text-amber-600">
                  {
                    stats.byStatus
                      .pending.count
                  }{' '}
                  flats
                </p>

              </div>

            </CardContent>

          </Card>

          {/* Overdue */}

          <Card className="bg-red-50 border-red-200 min-w-0">

            <CardContent className="p-4 sm:pt-6">

              <div className="text-center min-w-0">

                <p className="text-xs sm:text-sm text-red-600">
                  Overdue
                </p>

                <p className="text-lg sm:text-3xl font-bold text-red-600 break-all">
                  {formatAmount(
                    stats.byStatus
                      .overdue
                      .totalAmount
                  )}
                </p>

                <p className="text-xs text-red-600">
                  {
                    stats.byStatus
                      .overdue.count
                  }{' '}
                  flats
                </p>

              </div>

            </CardContent>

          </Card>

        </div>
      )}

      {/* FILTERS */}

      <Card className="min-w-0">

        <CardContent className="p-4 sm:pt-6">

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-4 min-w-0">

            {/* Month */}

            <div className="w-full sm:w-auto">

              <label className="text-sm text-gray-500 mb-1 block">
                Month
              </label>

              <Select
                value={monthFilter}
                onValueChange={
                  setMonthFilter
                }
              >

                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>

                <SelectContent>

                  {months.map(
                    (m) => (
                      <SelectItem
                        key={m.value}
                        value={m.value}
                      >
                        {m.label}
                      </SelectItem>
                    )
                  )}

                </SelectContent>

              </Select>

            </div>

            {/* Year */}

            <div className="w-full sm:w-auto">

              <label className="text-sm text-gray-500 mb-1 block">
                Year
              </label>

              <Select
                value={yearFilter}
                onValueChange={
                  setYearFilter
                }
              >

                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>

                <SelectContent>

                  {years.map(
                    (y) => (
                      <SelectItem
                        key={y}
                        value={y}
                      >
                        {y}
                      </SelectItem>
                    )
                  )}

                </SelectContent>

              </Select>

            </div>

            {/* Status */}

            <div className="w-full sm:w-auto">

              <label className="text-sm text-gray-500 mb-1 block">
                Status
              </label>

              <Select
                value={statusFilter}
                onValueChange={
                  setStatusFilter
                }
              >

                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>

                <SelectContent>

                  <SelectItem value="all">
                    All Status
                  </SelectItem>

                  <SelectItem value="paid">
                    Paid
                  </SelectItem>

                  <SelectItem value="pending">
                    Pending
                  </SelectItem>

                  <SelectItem value="overdue">
                    Overdue
                  </SelectItem>

                </SelectContent>

              </Select>

            </div>

          </div>

        </CardContent>

      </Card>

      {/* PAYMENT RECORDS */}

      <Card className="min-w-0 overflow-hidden">

        <CardHeader className="min-w-0">

          <CardTitle className="text-base sm:text-lg break-words">

            {isSuperAdmin &&
            selectedSociety !==
              'all'
              ? societies.find(
                  (s) =>
                    s._id ===
                    selectedSociety
                )?.name ||
                'Selected Society'
              : isSuperAdmin
              ? 'All Societies'
              : 'Society Payments'}

            {' - '}

            {getMonthName(
              parseInt(
                monthFilter
              )
            )}{' '}

            {yearFilter}

            {' - Maintenance Records'}

          </CardTitle>

        </CardHeader>

        <CardContent className="min-w-0">

          {loading ? (

            <div className="animate-pulse space-y-4">

              {[1, 2, 3, 4, 5].map(
                (i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 rounded"
                  />
                )
              )}

            </div>

          ) : maintenance.length === 0 ? (

            <div className="text-center py-8">

              <p className="text-gray-500">
                No maintenance records found
              </p>

              {user?.role ===
                'manager' && (
                <Button
                  variant="outline"
                  className="mt-4 w-full sm:w-auto"
                  onClick={() =>
                    setShowGenerateDialog(
                      true
                    )
                  }
                >
                  Generate Records
                </Button>
              )}

            </div>

          ) : (

            <>

              {/* MOBILE + TABLET */}

              <div className="space-y-3 lg:hidden min-w-0">

                {maintenance.map(
                  (m) => (
                    <div
                      key={m._id}
                      className="w-full min-w-0 rounded-xl border border-gray-200 bg-white p-4 space-y-4 overflow-hidden"
                    >

                      {/* Society */}

                      {isSuperAdmin && (
                        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">

                          <p className="text-xs text-blue-600">
                            Society
                          </p>

                          <p className="font-semibold text-blue-900 mt-1">
                            {
                              getSocietyName(
                                m
                              )
                            }
                          </p>

                          <p className="text-xs text-blue-700 mt-1">
                            {
                              getSocietyCode(
                                m
                              )
                            }
                          </p>

                        </div>
                      )}

                      {/* Resident + Status */}

                      <div className="flex items-start justify-between gap-3 min-w-0">

                        <div className="min-w-0 flex-1">

                          <p className="font-semibold text-gray-900">
                            Flat{' '}
                            {
                              m.flat_no
                            }
                          </p>

                          <p className="text-sm font-medium text-gray-800 mt-1 truncate">
                            {
                              m.user_id
                                ?.name ||
                              'N/A'
                            }
                          </p>

                          <p className="text-xs text-gray-500 mt-1 break-all">
                            {
                              m.user_id
                                ?.email ||
                              ''
                            }
                          </p>

                        </div>

                        <div className="flex-shrink-0">

                          <StatusBadge
                            variant={
                              paymentStatusVariant[
                                m.status
                              ]
                            }
                            dot
                          >
                            {m.status ===
                            'paid'
                              ? 'Paid'
                              : m.status ===
                                'overdue'
                              ? 'Overdue'
                              : 'Pending'}
                          </StatusBadge>

                        </div>

                      </div>

                      {/* Amount + Due Date */}

                      <div className="grid grid-cols-2 gap-4">

                        <div className="min-w-0">

                          <p className="text-xs text-gray-500">
                            Amount
                          </p>

                          <p className="font-semibold text-gray-900 mt-1 break-words">
                            {formatAmount(
                              m.total_amount
                            )}
                          </p>

                          {m.late_fee >
                            0 && (
                            <p className="text-xs text-red-600 mt-1 break-words">
                              +
                              {formatAmount(
                                m.late_fee
                              )}{' '}
                              late fee
                            </p>
                          )}

                        </div>

                        <div className="min-w-0">

                          <p className="text-xs text-gray-500">
                            Due Date
                          </p>

                          <p className="font-medium text-gray-900 mt-1 break-words">
                            {formatDate(
                              m.due_date
                            )}
                          </p>

                        </div>

                      </div>

                      {/* Paid Date */}

                      <div>

                        <p className="text-xs text-gray-500">
                          Paid Date
                        </p>

                        <p className="font-medium text-gray-900 mt-1">
                          {m.paid_date
                            ? formatDate(
                                m.paid_date
                              )
                            : '-'}
                        </p>

                      </div>

                    </div>
                  )
                )}

              </div>

              {/* DESKTOP TABLE */}

              <div className="hidden lg:block overflow-x-auto">

                <Table>

                  <TableHeader>

                    <TableRow>

                      {isSuperAdmin && (
                        <TableHead>
                          Society
                        </TableHead>
                      )}

                      <TableHead>
                        Flat
                      </TableHead>

                      <TableHead>
                        Resident
                      </TableHead>

                      <TableHead>
                        Amount
                      </TableHead>

                      <TableHead>
                        Due Date
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Paid Date
                      </TableHead>

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {maintenance.map(
                      (m) => (
                        <TableRow
                          key={m._id}
                        >

                          {isSuperAdmin && (
                            <TableCell>

                              <div>

                                <p className="font-semibold text-gray-900">
                                  {
                                    getSocietyName(
                                      m
                                    )
                                  }
                                </p>

                                <p className="text-xs text-gray-500">
                                  {
                                    getSocietyCode(
                                      m
                                    )
                                  }
                                </p>

                              </div>

                            </TableCell>
                          )}

                          <TableCell className="font-semibold">
                            {
                              m.flat_no
                            }
                          </TableCell>

                          <TableCell>

                            <div>

                              <p className="font-medium">
                                {
                                  m.user_id
                                    ?.name ||
                                  'N/A'
                                }
                              </p>

                              <p className="text-xs text-gray-500 break-all">
                                {
                                  m.user_id
                                    ?.email ||
                                  ''
                                }
                              </p>

                            </div>

                          </TableCell>

                          <TableCell>

                            <span className="font-medium">
                              {formatAmount(
                                m.total_amount
                              )}
                            </span>

                            {m.late_fee >
                              0 && (
                              <span className="text-xs text-red-600 block">
                                +
                                {formatAmount(
                                  m.late_fee
                                )}{' '}
                                late fee
                              </span>
                            )}

                          </TableCell>

                          <TableCell>
                            {formatDate(
                              m.due_date
                            )}
                          </TableCell>

                          <TableCell>

                            <StatusBadge
                              variant={
                                paymentStatusVariant[
                                  m.status
                                ]
                              }
                              dot
                            >
                              {m.status ===
                              'paid'
                                ? 'Paid'
                                : m.status ===
                                  'overdue'
                                ? 'Overdue'
                                : 'Pending'}
                            </StatusBadge>

                          </TableCell>

                          <TableCell>
                            {m.paid_date
                              ? formatDate(
                                  m.paid_date
                                )
                              : '-'}
                          </TableCell>

                        </TableRow>
                      )
                    )}

                  </TableBody>

                </Table>

              </div>

              {/* PAGINATION */}

              {pagination.pages >
                1 && (
                <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between min-w-0">

                  <p className="text-sm text-gray-500">

                    Showing{' '}

                    {(pagination.current -
                      1) *
                      pagination.limit +
                      1}{' '}

                    to{' '}

                    {Math.min(
                      pagination.current *
                        pagination.limit,
                      pagination.total
                    )}{' '}

                    of{' '}

                    {
                      pagination.total
                    }{' '}

                    records

                  </p>

                  <div className="flex gap-2 w-full sm:w-auto">

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      disabled={
                        pagination.current ===
                        1
                      }
                      onClick={() =>
                        setPagination(
                          (p) => ({
                            ...p,
                            current:
                              p.current -
                              1,
                          })
                        )
                      }
                    >
                      Previous
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      disabled={
                        pagination.current ===
                        pagination.pages
                      }
                      onClick={() =>
                        setPagination(
                          (p) => ({
                            ...p,
                            current:
                              p.current +
                              1,
                          })
                        )
                      }
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

      {/* GENERATE DIALOG */}

      <Dialog
        open={
          showGenerateDialog
        }
        onOpenChange={
          setShowGenerateDialog
        }
      >

        <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">

          <DialogHeader>

            <DialogTitle>
              Generate Monthly Maintenance
            </DialogTitle>

            <DialogDescription>

              This will create maintenance records
              for all registered flats for{' '}

              {
                getMonthName(
                  parseInt(
                    monthFilter
                  )
                )
              }{' '}

              {yearFilter}.

            </DialogDescription>

          </DialogHeader>

          <div className="py-4">

            <p className="text-sm text-gray-600 leading-6">

              • Base amount:{' '}
              <strong>
                ₹1,000
              </strong>

              <br />

              • Due date:{' '}
              <strong>
                18th
              </strong>{' '}
              of the month

              <br />

              • Late fee:{' '}
              <strong>
                ₹100
              </strong>{' '}
              after due date

              <br />

              • Existing records will be skipped

            </p>

          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                setShowGenerateDialog(
                  false
                )
              }
            >
              Cancel
            </Button>

            <Button
              className="w-full sm:w-auto"
              onClick={
                handleGenerateMaintenance
              }
              disabled={
                generating
              }
            >
              {generating
                ? 'Generating...'
                : 'Generate'}
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}