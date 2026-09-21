'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  AlertCircle,
  CheckCircle,
  ClipboardList,
  IndianRupee,
  Pencil,
  RefreshCw,
  Save,
  Settings,
  XCircle
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';


// ============================================================
// TYPES
// ============================================================

interface Society {
  _id: string;
  name: string;
  society_code: string;
}

interface MaintenanceUser {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  flat_no?: string;
  role?: string;
}

interface MaintenanceRecord {
  _id: string;
  society_id:
    | string
    | {
        _id: string;
        name?: string;
        society_code?: string;
      };

  user_id:
    | string
    | MaintenanceUser;

  flat_no: string;

  month: number;
  year: number;

  amount: number;
  late_fee: number;
  total_amount: number;

  due_date: string;

  paid_date?: string | null;

  status:
    | 'pending'
    | 'paid'
    | 'overdue';

  razorpay_payment_id?: string | null;
  razorpay_order_id?: string | null;
}

interface StatsData {
  month: number | null;
  year: number | null;

  society_id:
    | string
    | null;

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

interface MaintenanceSettings {
  society_id?: string;
  society_name?: string;
  society_code?: string;

  maintenance_amount:
    | number
    | null;

  maintenance_due_day:
    | number
    | null;

  maintenance_late_fee:
    | number
    | null;
}


// ============================================================
// PAGE
// ============================================================

export default function AdminPaymentsPage() {

  const { user } = useAuth();


  // ==========================================================
  // BASIC STATES
  // ==========================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');


  // ==========================================================
  // DATA
  // ==========================================================

  const [records, setRecords] =
    useState<MaintenanceRecord[]>([]);

  const [stats, setStats] =
    useState<StatsData | null>(null);

  const [societies, setSocieties] =
    useState<Society[]>([]);


  // ==========================================================
  // FILTERS
  // ==========================================================

  const currentDate =
    new Date();

  const [selectedMonth, setSelectedMonth] =
    useState(
      String(
        currentDate.getMonth() + 1
      )
    );

  const [selectedYear, setSelectedYear] =
    useState(
      String(
        currentDate.getFullYear()
      )
    );

  const [selectedStatus, setSelectedStatus] =
    useState('all');

  const [selectedSociety, setSelectedSociety] =
    useState('all');


  // ==========================================================
  // DIALOGS
  // ==========================================================

  const [showGenerateDialog, setShowGenerateDialog] =
    useState(false);

  const [showSettingsDialog, setShowSettingsDialog] =
    useState(false);

  const [showEditDialog, setShowEditDialog] =
    useState(false);


  // ==========================================================
  // SETTINGS
  // ==========================================================

  const [settings, setSettings] =
    useState<MaintenanceSettings>({
      maintenance_amount: null,
      maintenance_due_day: null,
      maintenance_late_fee: null
    });

  const [settingsForm, setSettingsForm] =
    useState({
      maintenance_amount: '',
      maintenance_due_day: '',
      maintenance_late_fee: ''
    });

  const [savingSettings, setSavingSettings] =
    useState(false);


  // ==========================================================
  // EDIT FORM
  // ==========================================================

  const [editingRecord, setEditingRecord] =
    useState<MaintenanceRecord | null>(null);

  const [editForm, setEditForm] =
    useState({
      amount: '',
      late_fee: '',
      due_date: ''
    });

  const [savingEdit, setSavingEdit] =
    useState(false);


  // ==========================================================
  // GENERATE
  // ==========================================================

  const [generating, setGenerating] =
    useState(false);


  // ==========================================================
  // ACCESS
  // ==========================================================

  const canManageMaintenance =
    user?.role === 'manager' ||
    user?.role === 'admin';

  const isSuperAdmin =
    user?.role === 'super_admin';


  // ==========================================================
  // FORMATTERS
  // ==========================================================

  const formatCurrency = (
    amount: number
  ) => {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }
    ).format(
      Number(amount || 0)
    );
  };


  const formatDate = (
    date?: string | null
  ) => {

    if (!date) {
      return '-';
    }

    return new Date(
      date
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    );
  };


  const getUser = (
    record: MaintenanceRecord
  ) => {

    if (
      typeof record.user_id === 'object'
    ) {
      return record.user_id;
    }

    return null;
  };


  const getSocietyName = (
    record: MaintenanceRecord
  ) => {

    if (
      typeof record.society_id === 'object'
    ) {
      return (
        record.society_id.name ||
        record.society_id.society_code ||
        '-'
      );
    }

    return '-';
  };


  // ==========================================================
  // FETCH SOCIETIES
  // ==========================================================

  const fetchSocieties =
    useCallback(
      async () => {

        if (!isSuperAdmin) {
          return;
        }

        try {

          const response =
            await api.get(
              '/societies'
            );

          if (
            response.data?.success
          ) {

            setSocieties(
              response.data.data || []
            );

          }

        } catch (err) {

          console.error(
            'Fetch societies error:',
            err
          );

        }

      },
      [isSuperAdmin]
    );


  // ==========================================================
  // FETCH MAINTENANCE
  // ==========================================================

  const fetchMaintenance =
    useCallback(
      async (
        showLoader = true
      ) => {

        try {

          if (showLoader) {
            setLoading(true);
          }

          setError('');

          const params =
            new URLSearchParams();

          params.set(
            'month',
            selectedMonth
          );

          params.set(
            'year',
            selectedYear
          );

          if (
            selectedStatus !== 'all'
          ) {
            params.set(
              'status',
              selectedStatus
            );
          }

          if (
            isSuperAdmin &&
            selectedSociety !== 'all'
          ) {

            params.set(
              'society_id',
              selectedSociety
            );

          }


          const [
            maintenanceResponse,
            statsResponse
          ] =
            await Promise.all([

              api.get(
                `/maintenance/all?${params.toString()}`
              ),

              api.get(
                `/maintenance/stats?${params.toString()}`
              )

            ]);


          if (
            maintenanceResponse.data?.success
          ) {

            setRecords(
              maintenanceResponse.data.data || []
            );

          }


          if (
            statsResponse.data?.success
          ) {

            setStats(
              statsResponse.data.data
            );

          }

        } catch (err: any) {

          console.error(
            'Fetch maintenance error:',
            err
          );

          setError(
            err?.response?.data?.message ||
            'Failed to load maintenance data.'
          );

        } finally {

          setLoading(false);
          setRefreshing(false);

        }

      },
      [
        selectedMonth,
        selectedYear,
        selectedStatus,
        selectedSociety,
        isSuperAdmin
      ]
    );


  // ==========================================================
  // FETCH SETTINGS
  // ==========================================================

  const fetchSettings =
    useCallback(
      async () => {

        if (!canManageMaintenance) {
          return;
        }

        try {

          const response =
            await api.get(
              '/maintenance/settings'
            );

          if (
            response.data?.success
          ) {

            const data =
              response.data.data;

            setSettings(data);

            setSettingsForm({

              maintenance_amount:
                data.maintenance_amount !== null &&
                data.maintenance_amount !== undefined
                  ? String(
                      data.maintenance_amount
                    )
                  : '',

              maintenance_due_day:
                data.maintenance_due_day !== null &&
                data.maintenance_due_day !== undefined
                  ? String(
                      data.maintenance_due_day
                    )
                  : '',

              maintenance_late_fee:
                data.maintenance_late_fee !== null &&
                data.maintenance_late_fee !== undefined
                  ? String(
                      data.maintenance_late_fee
                    )
                  : ''

            });

          }

        } catch (err) {

          console.error(
            'Fetch maintenance settings error:',
            err
          );

        }

      },
      [canManageMaintenance]
    );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    if (!user) {
      return;
    }

    fetchSocieties();

    fetchMaintenance();

    fetchSettings();

  }, [
    user,
    fetchSocieties,
    fetchMaintenance,
    fetchSettings
  ]);


  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh =
    async () => {

      setRefreshing(true);

      await Promise.all([
        fetchMaintenance(false),
        fetchSettings()
      ]);

      setRefreshing(false);
    };


  // ==========================================================
  // SAVE SETTINGS
  // ==========================================================

  const handleSaveSettings =
    async () => {

      setError('');
      setSuccessMessage('');

      const amount =
        Number(
          settingsForm.maintenance_amount
        );

      const dueDay =
        Number(
          settingsForm.maintenance_due_day
        );

      const lateFee =
        Number(
          settingsForm.maintenance_late_fee || 0
        );


      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {

        setError(
          'Maintenance amount must be greater than 0.'
        );

        return;
      }


      if (
        !Number.isInteger(dueDay) ||
        dueDay < 1 ||
        dueDay > 28
      ) {

        setError(
          'Due day must be between 1 and 28.'
        );

        return;
      }


      if (
        !Number.isFinite(lateFee) ||
        lateFee < 0
      ) {

        setError(
          'Late fee cannot be negative.'
        );

        return;
      }


      try {

        setSavingSettings(true);

        const response =
          await api.put(
            '/maintenance/settings',
            {
              maintenance_amount:
                amount,

              maintenance_due_day:
                dueDay,

              maintenance_late_fee:
                lateFee
            }
          );


        if (
          response.data?.success
        ) {

          setSettings(
            response.data.data
          );

          setSuccessMessage(
            'Maintenance settings updated successfully.'
          );

          setShowSettingsDialog(false);

        } else {

          setError(
            response.data?.message ||
            'Failed to update settings.'
          );

        }

      } catch (err: any) {

        console.error(
          'Save settings error:',
          err
        );

        setError(
          err?.response?.data?.message ||
          'Failed to update maintenance settings.'
        );

      } finally {

        setSavingSettings(false);

      }

    };


  // ==========================================================
  // OPEN SETTINGS
  // ==========================================================

  const openSettings =
    () => {

      setError('');

      setSettingsForm({

        maintenance_amount:
          settings.maintenance_amount !== null &&
          settings.maintenance_amount !== undefined
            ? String(
                settings.maintenance_amount
              )
            : '',

        maintenance_due_day:
          settings.maintenance_due_day !== null &&
          settings.maintenance_due_day !== undefined
            ? String(
                settings.maintenance_due_day
              )
            : '',

        maintenance_late_fee:
          settings.maintenance_late_fee !== null &&
          settings.maintenance_late_fee !== undefined
            ? String(
                settings.maintenance_late_fee
              )
            : ''

      });

      setShowSettingsDialog(true);
    };


  // ==========================================================
  // GENERATE MONTHLY MAINTENANCE
  // ==========================================================

  const handleGenerate =
    async () => {

      setError('');
      setSuccessMessage('');

      const amount =
        Number(
          settingsForm.maintenance_amount
        );

      const dueDay =
        Number(
          settingsForm.maintenance_due_day
        );

      const lateFee =
        Number(
          settingsForm.maintenance_late_fee || 0
        );


      // ------------------------------------------------------
      // NO DEFAULT AMOUNT
      // ------------------------------------------------------

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {

        setError(
          'Please configure the maintenance amount first.'
        );

        setShowGenerateDialog(false);

        return;
      }


      if (
        !Number.isInteger(dueDay) ||
        dueDay < 1 ||
        dueDay > 28
      ) {

        setError(
          'Please configure a valid due day between 1 and 28.'
        );

        setShowGenerateDialog(false);

        return;
      }


      try {

        setGenerating(true);

        const response =
          await api.post(
            '/maintenance/generate',
            {
              month:
                Number(
                  selectedMonth
                ),

              year:
                Number(
                  selectedYear
                ),

              amount,

              due_day:
                dueDay,

              late_fee:
                lateFee
            }
          );


        if (
          response.data?.success
        ) {

          const data =
            response.data.data;

          setSuccessMessage(
            `Maintenance generated successfully. Created: ${
              data?.created ?? 0
            }, Skipped: ${
              data?.skipped ?? 0
            }.`
          );

          setShowGenerateDialog(false);

          await fetchMaintenance(false);

        } else {

          setError(
            response.data?.message ||
            'Failed to generate maintenance.'
          );

        }

      } catch (err: any) {

        console.error(
          'Generate maintenance error:',
          err
        );

        setError(
          err?.response?.data?.message ||
          'Failed to generate maintenance.'
        );

      } finally {

        setGenerating(false);

      }

    };


  // ==========================================================
  // OPEN EDIT
  // ==========================================================

  const openEdit =
    (
      record: MaintenanceRecord
    ) => {

      if (
        record.status === 'paid'
      ) {
        return;
      }

      setEditingRecord(record);

      setEditForm({

        amount:
          String(
            record.amount
          ),

        late_fee:
          String(
            record.late_fee || 0
          ),

        due_date:
          record.due_date
            ? new Date(
                record.due_date
              )
                .toISOString()
                .split('T')[0]
            : ''

      });

      setError('');

      setShowEditDialog(true);
    };


  // ==========================================================
  // SAVE EDIT
  // ==========================================================

  const handleSaveEdit =
    async () => {

      if (!editingRecord) {
        return;
      }

      setError('');
      setSuccessMessage('');

      const amount =
        Number(
          editForm.amount
        );

      const lateFee =
        Number(
          editForm.late_fee || 0
        );


      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {

        setError(
          'Maintenance amount must be greater than 0.'
        );

        return;
      }


      if (
        !Number.isFinite(lateFee) ||
        lateFee < 0
      ) {

        setError(
          'Late fee cannot be negative.'
        );

        return;
      }


      if (
        !editForm.due_date
      ) {

        setError(
          'Due date is required.'
        );

        return;
      }


      try {

        setSavingEdit(true);

        const response =
          await api.put(
            `/maintenance/${editingRecord._id}`,
            {
              amount,

              late_fee:
                lateFee,

              due_date:
                editForm.due_date
            }
          );


        if (
          response.data?.success
        ) {

          setSuccessMessage(
            'Maintenance updated successfully.'
          );

          setShowEditDialog(false);

          setEditingRecord(null);

          await fetchMaintenance(false);

        } else {

          setError(
            response.data?.message ||
            'Failed to update maintenance.'
          );

        }

      } catch (err: any) {

        console.error(
          'Edit maintenance error:',
          err
        );

        setError(
          err?.response?.data?.message ||
          'Failed to update maintenance.'
        );

      } finally {

        setSavingEdit(false);

      }

    };


  // ==========================================================
  // MONTH NAMES
  // ==========================================================

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
    'December'
  ];


  // ==========================================================
  // YEARS
  // ==========================================================

  const years =
    useMemo(() => {

      const current =
        new Date().getFullYear();

      return [
        current - 1,
        current,
        current + 1
      ];

    }, []);


  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const StatusBadge = ({
    status
  }: {
    status:
      | 'pending'
      | 'paid'
      | 'overdue';
  }) => {

    if (
      status === 'paid'
    ) {

      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle
            className="h-3.5 w-3.5"
          />
          Paid
        </span>
      );

    }


    if (
      status === 'overdue'
    ) {

      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          <XCircle
            className="h-3.5 w-3.5"
          />
          Overdue
        </span>
      );

    }


    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
        <AlertCircle
          className="h-3.5 w-3.5"
        />
        Pending
      </span>
    );
  };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (
    loading &&
    !records.length
  ) {

    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-500">
            Loading maintenance...
          </p>
        </div>
      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="space-y-6 p-4 md:p-6">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-100 p-3">
              <ClipboardList
                className="h-7 w-7 text-blue-600"
              />
            </div>

            <div>

              <h1 className="text-2xl font-bold text-gray-900">
                Maintenance Management
              </h1>

              <p className="text-sm text-gray-500">
                Manage society maintenance records
              </p>

            </div>

          </div>

        </div>


        <div className="flex flex-wrap gap-2">

          {canManageMaintenance && (
            <>
              <button
                type="button"
                onClick={openSettings}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <Settings
                  className="h-4 w-4"
                />
                Maintenance Settings
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowGenerateDialog(true)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
              >
                <ClipboardList
                  className="h-4 w-4"
                />
                Generate Monthly
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />
            Refresh
          </button>

        </div>

      </div>


      {/* ======================================================
          SUCCESS
      ====================================================== */}

      {successMessage && (

        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">

          <CheckCircle
            className="mt-0.5 h-5 w-5 shrink-0"
          />

          <div className="flex-1 text-sm">
            {successMessage}
          </div>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage('')
            }
            className="text-green-700"
          >
            ×
          </button>

        </div>

      )}


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">

          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0"
          />

          <div className="flex-1 text-sm">
            {error}
          </div>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
            className="text-red-700"
          >
            ×
          </button>

        </div>

      )}


      {/* ======================================================
          SETTINGS SUMMARY
      ====================================================== */}

      {canManageMaintenance && (

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-3">

              <div className="rounded-lg bg-purple-100 p-2.5">
                <Settings
                  className="h-5 w-5 text-purple-600"
                />
              </div>

              <div>

                <h2 className="font-semibold text-gray-900">
                  Maintenance Settings
                </h2>

                <p className="text-xs text-gray-500">
                  Only Manager/Admin can change these settings
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={openSettings}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
            >
              <Pencil
                className="h-4 w-4"
              />
              Edit
            </button>

          </div>


          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs text-gray-500">
                Monthly Amount
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">

                {settings.maintenance_amount !== null &&
                settings.maintenance_amount !== undefined
                  ? formatCurrency(
                      settings.maintenance_amount
                    )
                  : 'Not configured'}

              </p>

            </div>


            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs text-gray-500">
                Due Day
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">

                {settings.maintenance_due_day
                  ? `${settings.maintenance_due_day}th`
                  : 'Not configured'}

              </p>

            </div>


            <div className="rounded-xl bg-gray-50 p-4">

              <p className="text-xs text-gray-500">
                Late Fee
              </p>

              <p className="mt-1 text-xl font-bold text-gray-900">

                {settings.maintenance_late_fee !== null &&
                settings.maintenance_late_fee !== undefined
                  ? formatCurrency(
                      settings.maintenance_late_fee
                    )
                  : 'Not configured'}

              </p>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">

          <div>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Month
            </label>

            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >

              {months.map(
                (
                  month,
                  index
                ) => (

                  <option
                    key={month}
                    value={
                      index + 1
                    }
                  >
                    {month}
                  </option>

                )
              )}

            </select>

          </div>


          <div>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Year
            </label>

            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >

              {years.map(
                year => (

                  <option
                    key={year}
                    value={year}
                  >
                    {year}
                  </option>

                )
              )}

            </select>

          </div>


          <div>

            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={selectedStatus}
              onChange={(e) =>
                setSelectedStatus(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            >

              <option value="all">
                All Status
              </option>

              <option value="pending">
                Pending
              </option>

              <option value="overdue">
                Overdue
              </option>

              <option value="paid">
                Paid
              </option>

            </select>

          </div>


          {isSuperAdmin && (

            <div>

              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Society
              </label>

              <select
                value={selectedSociety}
                onChange={(e) =>
                  setSelectedSociety(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >

                <option value="all">
                  All Societies
                </option>

                {societies.map(
                  society => (

                    <option
                      key={society._id}
                      value={society._id}
                    >
                      {society.name}
                    </option>

                  )
                )}

              </select>

            </div>

          )}

        </div>

      </div>


      {/* ======================================================
          STATS
      ====================================================== */}

      {stats && (

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Total Maintenance
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {stats.totals.totalFlats}
                </p>

              </div>

              <ClipboardList
                className="h-7 w-7 text-blue-500"
              />

            </div>

            <p className="mt-2 text-sm text-gray-500">
              {formatCurrency(
                stats.totals.totalExpected
              )}
            </p>

          </div>


          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Paid
                </p>

                <p className="mt-1 text-2xl font-bold text-green-600">
                  {stats.byStatus.paid.count}
                </p>

              </div>

              <CheckCircle
                className="h-7 w-7 text-green-500"
              />

            </div>

            <p className="mt-2 text-sm text-gray-500">
              {formatCurrency(
                stats.byStatus.paid.totalAmount
              )}
            </p>

          </div>


          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Pending
                </p>

                <p className="mt-1 text-2xl font-bold text-yellow-600">
                  {stats.byStatus.pending.count}
                </p>

              </div>

              <AlertCircle
                className="h-7 w-7 text-yellow-500"
              />

            </div>

            <p className="mt-2 text-sm text-gray-500">
              {formatCurrency(
                stats.byStatus.pending.totalAmount
              )}
            </p>

          </div>


          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-sm text-gray-500">
                  Overdue
                </p>

                <p className="mt-1 text-2xl font-bold text-red-600">
                  {stats.byStatus.overdue.count}
                </p>

              </div>

              <XCircle
                className="h-7 w-7 text-red-500"
              />

            </div>

            <p className="mt-2 text-sm text-gray-500">
              {formatCurrency(
                stats.byStatus.overdue.totalAmount
              )}
            </p>

          </div>

        </div>

      )}


      {/* ======================================================
          MOBILE RECORDS
      ====================================================== */}

      <div className="space-y-4 md:hidden">

        {records.length === 0 ? (

          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">

            <ClipboardList
              className="mx-auto h-10 w-10 text-gray-300"
            />

            <p className="mt-3 font-medium text-gray-700">
              No maintenance records found
            </p>

            {canManageMaintenance && (
              <p className="mt-1 text-sm text-gray-500">
                Configure maintenance and generate it for this month.
              </p>
            )}

          </div>

        ) : (

          records.map(
            record => {

              const recordUser =
                getUser(record);

              return (

                <div
                  key={record._id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <p className="font-semibold text-gray-900">
                        Flat {record.flat_no}
                      </p>

                      <p className="text-sm text-gray-500">
                        {recordUser?.name || '-'}
                      </p>

                      {isSuperAdmin && (
                        <p className="mt-1 text-xs text-gray-400">
                          {getSocietyName(record)}
                        </p>
                      )}

                    </div>

                    <StatusBadge
                      status={record.status}
                    />

                  </div>


                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">

                    <div>

                      <p className="text-gray-500">
                        Amount
                      </p>

                      <p className="font-semibold">
                        {formatCurrency(
                          record.amount
                        )}
                      </p>

                    </div>


                    <div>

                      <p className="text-gray-500">
                        Late Fee
                      </p>

                      <p className="font-semibold">
                        {formatCurrency(
                          record.late_fee
                        )}
                      </p>

                    </div>


                    <div>

                      <p className="text-gray-500">
                        Total
                      </p>

                      <p className="font-semibold">
                        {formatCurrency(
                          record.total_amount
                        )}
                      </p>

                    </div>


                    <div>

                      <p className="text-gray-500">
                        Due Date
                      </p>

                      <p className="font-semibold">
                        {formatDate(
                          record.due_date
                        )}
                      </p>

                    </div>

                  </div>


                  {canManageMaintenance &&
                    record.status !== 'paid' && (

                    <button
                      type="button"
                      onClick={() =>
                        openEdit(record)
                      }
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil
                        className="h-4 w-4"
                      />
                      Edit Maintenance
                    </button>

                  )}

                </div>

              );

            }
          )

        )}

      </div>


      {/* ======================================================
          DESKTOP TABLE
      ====================================================== */}

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="border-b border-gray-200 bg-gray-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Flat
                </th>

                {isSuperAdmin && (
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Society
                  </th>
                )}

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Resident
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Late Fee
                </th>

                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Total
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Due Date
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Status
                </th>

                {canManageMaintenance && (
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                )}

              </tr>

            </thead>


            <tbody className="divide-y divide-gray-100">

              {records.length === 0 ? (

                <tr>

                  <td
                    colSpan={
                      canManageMaintenance
                        ? isSuperAdmin
                          ? 9
                          : 8
                        : isSuperAdmin
                          ? 8
                          : 7
                    }
                    className="px-5 py-12 text-center"
                  >

                    <ClipboardList
                      className="mx-auto h-10 w-10 text-gray-300"
                    />

                    <p className="mt-3 font-medium text-gray-700">
                      No maintenance records found
                    </p>

                  </td>

                </tr>

              ) : (

                records.map(
                  record => {

                    const recordUser =
                      getUser(record);

                    return (

                      <tr
                        key={record._id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                          {record.flat_no}
                        </td>


                        {isSuperAdmin && (

                          <td className="px-5 py-4 text-sm text-gray-600">
                            {getSocietyName(
                              record
                            )}
                          </td>

                        )}


                        <td className="px-5 py-4">

                          <p className="text-sm font-medium text-gray-900">
                            {recordUser?.name || '-'}
                          </p>

                          <p className="text-xs text-gray-500">
                            {recordUser?.email || ''}
                          </p>

                        </td>


                        <td className="px-5 py-4 text-right text-sm text-gray-700">
                          {formatCurrency(
                            record.amount
                          )}
                        </td>


                        <td className="px-5 py-4 text-right text-sm text-gray-700">
                          {formatCurrency(
                            record.late_fee
                          )}
                        </td>


                        <td className="px-5 py-4 text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(
                            record.total_amount
                          )}
                        </td>


                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDate(
                            record.due_date
                          )}
                        </td>


                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              record.status
                            }
                          />
                        </td>


                        {canManageMaintenance && (

                          <td className="px-5 py-4 text-right">

                            {record.status !== 'paid' ? (

                              <button
                                type="button"
                                onClick={() =>
                                  openEdit(
                                    record
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                              >
                                <Pencil
                                  className="h-3.5 w-3.5"
                                />
                                Edit
                              </button>

                            ) : (

                              <span className="text-xs text-gray-400">
                                Paid
                              </span>

                            )}

                          </td>

                        )}

                      </tr>

                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* ======================================================
          SETTINGS DIALOG
      ====================================================== */}

      {showSettingsDialog && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Maintenance Settings
                </h2>

                <p className="text-sm text-gray-500">
                  Configure maintenance for your society
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSettingsDialog(false)
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>

            </div>


            <div className="space-y-4 p-5">

              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Monthly Maintenance Amount
                </label>

                <div className="relative">

                  <IndianRupee
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      settingsForm.maintenance_amount
                    }
                    onChange={(e) =>
                      setSettingsForm(
                        prev => ({
                          ...prev,
                          maintenance_amount:
                            e.target.value
                        })
                      )
                    }
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none focus:border-blue-500"
                  />

                </div>

                <p className="mt-1 text-xs text-gray-500">
                  This amount will be used when monthly maintenance is generated.
                </p>

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Maintenance Due Day
                </label>

                <input
                  type="number"
                  min="1"
                  max="28"
                  value={
                    settingsForm.maintenance_due_day
                  }
                  onChange={(e) =>
                    setSettingsForm(
                      prev => ({
                        ...prev,
                        maintenance_due_day:
                          e.target.value
                      })
                    )
                  }
                  placeholder="1 - 28"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Late Fee
                </label>

                <div className="relative">

                  <IndianRupee
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      settingsForm.maintenance_late_fee
                    }
                    onChange={(e) =>
                      setSettingsForm(
                        prev => ({
                          ...prev,
                          maintenance_late_fee:
                            e.target.value
                        })
                      )
                    }
                    placeholder="Enter late fee"
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none focus:border-blue-500"
                  />

                </div>

              </div>

            </div>


            <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowSettingsDialog(false)
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >

                {savingSettings ? (
                  <RefreshCw
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Save
                    className="h-4 w-4"
                  />
                )}

                Save Settings

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          GENERATE DIALOG
      ====================================================== */}

      {showGenerateDialog && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Generate Monthly Maintenance
                </h2>

                <p className="text-sm text-gray-500">
                  {months[
                    Number(selectedMonth) - 1
                  ]}{' '}
                  {selectedYear}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowGenerateDialog(false)
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>

            </div>


            <div className="space-y-4 p-5">

              <div className="rounded-xl bg-blue-50 p-4">

                <p className="text-sm text-blue-800">
                  Maintenance will be generated using the current society settings.
                </p>

              </div>


              <div className="grid grid-cols-3 gap-3">

                <div className="rounded-lg bg-gray-50 p-3">

                  <p className="text-xs text-gray-500">
                    Amount
                  </p>

                  <p className="mt-1 font-bold text-gray-900">

                    {settings.maintenance_amount
                      ? formatCurrency(
                          settings.maintenance_amount
                        )
                      : 'Not set'}

                  </p>

                </div>


                <div className="rounded-lg bg-gray-50 p-3">

                  <p className="text-xs text-gray-500">
                    Due Day
                  </p>

                  <p className="mt-1 font-bold text-gray-900">

                    {settings.maintenance_due_day ||
                      'Not set'}

                  </p>

                </div>


                <div className="rounded-lg bg-gray-50 p-3">

                  <p className="text-xs text-gray-500">
                    Late Fee
                  </p>

                  <p className="mt-1 font-bold text-gray-900">

                    {settings.maintenance_late_fee !== null &&
                    settings.maintenance_late_fee !== undefined
                      ? formatCurrency(
                          settings.maintenance_late_fee
                        )
                      : 'Not set'}

                  </p>

                </div>

              </div>


              {!settings.maintenance_amount && (

                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

                  Please configure the maintenance amount before generating maintenance.

                </div>

              )}

            </div>


            <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowGenerateDialog(false)
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={
                  generating ||
                  !settings.maintenance_amount
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {generating && (
                  <RefreshCw
                    className="h-4 w-4 animate-spin"
                  />
                )}

                {generating
                  ? 'Generating...'
                  : 'Generate'}

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          EDIT DIALOG
      ====================================================== */}

      {showEditDialog &&
        editingRecord && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">

              <div>

                <h2 className="text-lg font-bold text-gray-900">
                  Edit Maintenance
                </h2>

                <p className="text-sm text-gray-500">
                  Flat {editingRecord.flat_no}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowEditDialog(false)
                }
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>

            </div>


            <div className="space-y-4 p-5">

              <div className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
                Only unpaid maintenance can be edited.
              </div>


              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Maintenance Amount
                </label>

                <div className="relative">

                  <IndianRupee
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      editForm.amount
                    }
                    onChange={(e) =>
                      setEditForm(
                        prev => ({
                          ...prev,
                          amount:
                            e.target.value
                        })
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none focus:border-blue-500"
                  />

                </div>

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Late Fee
                </label>

                <div className="relative">

                  <IndianRupee
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      editForm.late_fee
                    }
                    onChange={(e) =>
                      setEditForm(
                        prev => ({
                          ...prev,
                          late_fee:
                            e.target.value
                        })
                      )
                    }
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 outline-none focus:border-blue-500"
                  />

                </div>

              </div>


              <div>

                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Due Date
                </label>

                <input
                  type="date"
                  value={
                    editForm.due_date
                  }
                  onChange={(e) =>
                    setEditForm(
                      prev => ({
                        ...prev,
                        due_date:
                          e.target.value
                      })
                    )
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                />

              </div>


              <div className="rounded-xl bg-gray-50 p-4">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    New Total
                  </span>

                  <span className="text-lg font-bold text-gray-900">

                    {formatCurrency(
                      Number(
                        editForm.amount || 0
                      ) +
                      Number(
                        editForm.late_fee || 0
                      )
                    )}

                  </span>

                </div>

              </div>

            </div>


            <div className="flex justify-end gap-3 border-t border-gray-200 px-5 py-4">

              <button
                type="button"
                onClick={() =>
                  setShowEditDialog(false)
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >

                {savingEdit ? (
                  <RefreshCw
                    className="h-4 w-4 animate-spin"
                  />
                ) : (
                  <Save
                    className="h-4 w-4"
                  />
                )}

                Save Changes

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}