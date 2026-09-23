'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

import api from '@/lib/api';

import {
  FileText,
  Download,
  Loader2,
  RefreshCw,
  Building2,
  IndianRupee,
  CheckCircle,
  Clock,
  AlertTriangle,
  MessageSquare,
  Siren,
  Users,
  Wrench,
  ChevronDown,
  BarChart3,
} from 'lucide-react';

import {
  generateMaintenanceReportPDF,
} from '@/lib/generateReport';


// ============================================================
// TYPES
// ============================================================

interface Society {
  _id: string;
  name: string;
  society_code?: string;
}


// ============================================================
// REPORT TYPES
// ============================================================

type ReportType =
  | 'maintenance'
  | 'complaints'
  | 'emergency'
  | 'users'
  | 'assets';


// ============================================================
// GENERIC REPORT DATA
// ============================================================

interface ReportData {
  summary?: Record<string, any>;
  records?: any[];
  society_id?: string | null;
  all_societies?: boolean;
  society_wise?: any[];
  byStatus?: Record<string, any>;
  by_type?: Record<string, any>;
}


// ============================================================
// PAGE
// ============================================================

export default function ReportsPage() {

  const { user } = useAuth();

  const { toast } = useToast();


  // ==========================================================
  // STATES
  // ==========================================================

  const [societies, setSocieties] =
    useState<Society[]>([]);

  const [selectedSocietyId, setSelectedSocietyId] =
    useState('all');

  const [loadingSocieties, setLoadingSocieties] =
    useState(false);

  const [loadingReport, setLoadingReport] =
    useState(false);

  const [reportType, setReportType] =
    useState<ReportType>('maintenance');

  const [report, setReport] =
    useState<ReportData | null>(null);

  const [error, setError] =
    useState('');


  // ==========================================================
  // MAINTENANCE FILTERS
  // ==========================================================

  const currentDate = new Date();

  const [selectedMonth, setSelectedMonth] =
    useState(
      String(currentDate.getMonth() + 1)
    );

  const [selectedYear, setSelectedYear] =
    useState(
      String(currentDate.getFullYear())
    );

  const [maintenanceStatus, setMaintenanceStatus] =
    useState('all');


  // ==========================================================
  // COMPLAINT FILTER
  // ==========================================================

  const [complaintStatus, setComplaintStatus] =
    useState('all');


  // ==========================================================
  // EMERGENCY FILTER
  // ==========================================================

  const [emergencyStatus, setEmergencyStatus] =
    useState('all');


  // ==========================================================
  // USERS FILTERS
  // ==========================================================

  const [userRole, setUserRole] =
    useState('all');

  const [userActive, setUserActive] =
    useState('all');


  // ==========================================================
  // ASSET FILTERS
  // ==========================================================

  const [assetType, setAssetType] =
    useState('all');

  const [assetStatus, setAssetStatus] =
    useState('all');


  // ==========================================================
  // ROLE
  // ==========================================================

  const isSuperAdmin =
    user?.role === 'super_admin';

  const canViewReports =
    user &&
    [
      'super_admin',
      'manager',
      'admin',
    ].includes(user.role);


  // ==========================================================
  // REPORT CONFIG
  // ==========================================================

  const reportConfig = useMemo(
    () => ({

      maintenance: {
        title: 'Maintenance Report',
        description:
          'Maintenance collection, pending payments and overdue payments.',
        icon: IndianRupee,
      },

      complaints: {
        title: 'Complaint Report',
        description:
          'Complaint status, residents and complaint dates.',
        icon: MessageSquare,
      },

      emergency: {
        title: 'Emergency Report',
        description:
          'Emergency alerts, active cases and resolution details.',
        icon: Siren,
      },

      users: {
        title: 'Users / Residents Report',
        description:
          'Residents, managers, admins and user status.',
        icon: Users,
      },

      assets: {
        title: 'Assets Report',
        description:
          'Lift, water pump, generator and service status.',
        icon: Wrench,
      },

    }),
    []
  );


  // ==========================================================
  // LOAD SOCIETIES
  // ==========================================================

  useEffect(() => {

    if (!isSuperAdmin) {
      return;
    }

    const fetchSocieties =
      async () => {

        try {

          setLoadingSocieties(true);

          const response =
            await api.get('/societies');

          if (
            response.data?.success
          ) {

            setSocieties(
              response.data.data || []
            );

          }

        } catch (error) {

          console.error(
            'Failed to load societies:',
            error
          );

          toast({

            title: 'Error',

            description:
              'Failed to load societies.',

            variant: 'destructive',

          });

        } finally {

          setLoadingSocieties(false);

        }

      };


    fetchSocieties();

  }, [
    isSuperAdmin,
    toast,
  ]);


  // ==========================================================
  // BUILD QUERY PARAMETERS
  // ==========================================================

  const buildQuery =
    () => {

      const params =
        new URLSearchParams();


      // --------------------------------------------------------
      // SOCIETY
      // --------------------------------------------------------

      if (
        isSuperAdmin &&
        selectedSocietyId !== 'all'
      ) {

        params.set(
          'society_id',
          selectedSocietyId
        );

      }


      // --------------------------------------------------------
      // MAINTENANCE
      // --------------------------------------------------------

      if (
        reportType === 'maintenance'
      ) {

        if (selectedMonth) {

          params.set(
            'month',
            selectedMonth
          );

        }

        if (selectedYear) {

          params.set(
            'year',
            selectedYear
          );

        }

        if (
          maintenanceStatus !== 'all'
        ) {

          params.set(
            'status',
            maintenanceStatus
          );

        }

      }


      // --------------------------------------------------------
      // COMPLAINTS
      // --------------------------------------------------------

      if (
        reportType === 'complaints' &&
        complaintStatus !== 'all'
      ) {

        params.set(
          'status',
          complaintStatus
        );

      }


      // --------------------------------------------------------
      // EMERGENCY
      // --------------------------------------------------------

      if (
        reportType === 'emergency' &&
        emergencyStatus !== 'all'
      ) {

        params.set(
          'status',
          emergencyStatus
        );

      }


      // --------------------------------------------------------
      // USERS
      // --------------------------------------------------------

      if (
        reportType === 'users'
      ) {

        if (
          userRole !== 'all'
        ) {

          params.set(
            'role',
            userRole
          );

        }

        if (
          userActive !== 'all'
        ) {

          params.set(
            'is_active',
            userActive
          );

        }

      }


      // --------------------------------------------------------
      // ASSETS
      // --------------------------------------------------------

      if (
        reportType === 'assets'
      ) {

        if (
          assetType !== 'all'
        ) {

          params.set(
            'type',
            assetType
          );

        }

        if (
          assetStatus !== 'all'
        ) {

          params.set(
            'status',
            assetStatus
          );

        }

      }


      return params;

    };


  // ==========================================================
  // LOAD REPORT
  // ==========================================================

  const handleLoadReport =
    async () => {

      try {

        setLoadingReport(true);

        setError('');

        setReport(null);


        const params =
          buildQuery();


        const query =
          params.toString();


        const response =
          await api.get(
            `/reports/${reportType}${
              query
                ? `?${query}`
                : ''
            }`
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            'Failed to load report.'
          );

        }


        setReport(
          response.data.data || null
        );


      } catch (error: any) {

        console.error(
          'Report loading error:',
          error
        );

        const message =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load report.';


        setError(message);


        toast({

          title:
            'Report Loading Failed',

          description:
            message,

          variant:
            'destructive',

        });

      } finally {

        setLoadingReport(false);

      }

    };


  // ==========================================================
  // DOWNLOAD MAINTENANCE PDF
  // ==========================================================

  const handleMaintenancePDF =
    async () => {

      if (
        !report ||
        reportType !== 'maintenance'
      ) {

        return;

      }


      try {

        setLoadingReport(true);


        const records =
          report.records || [];


        let societyName =
          'All Societies';

        let societyCode =
          '';


        // ------------------------------------------------------
        // SUPER ADMIN SELECTED SOCIETY
        // ------------------------------------------------------

        if (
          isSuperAdmin &&
          selectedSocietyId !== 'all'
        ) {

          const selectedSociety =
            societies.find(
              society =>
                society._id ===
                selectedSocietyId
            );


          societyName =
            selectedSociety?.name ||
            'Society Management';


          societyCode =
            selectedSociety?.society_code ||
            '';

        }


        // ------------------------------------------------------
        // MANAGER / ADMIN
        // ------------------------------------------------------

        if (
          !isSuperAdmin
        ) {

          const currentUser =
            user as typeof user & {

              society_name?: string;

              society?: {
                name?: string;
                society_code?: string;
              };

            };


          societyName =
            currentUser?.society_name ||
            currentUser?.society?.name ||
            'Society Management';


          societyCode =
            currentUser?.society?.society_code ||
            '';

        }


        generateMaintenanceReportPDF({

          societyName,

          societyCode,

          records,

          generatedBy:
            user?.name || '',

          reportTitle:
            'Maintenance Report',

        });


        toast({

          title:
            'PDF Downloaded',

          description:
            'Maintenance report PDF has been generated successfully.',

        });


      } catch (error: any) {

        console.error(
          'PDF generation error:',
          error
        );


        toast({

          title:
            'PDF Generation Failed',

          description:
            error?.message ||
            'Failed to generate PDF.',

          variant:
            'destructive',

        });

      } finally {

        setLoadingReport(false);

      }

    };


  // ==========================================================
  // FORMAT CURRENCY
  // ==========================================================

  const formatCurrency =
    (value: any) => {

      return new Intl.NumberFormat(
        'en-IN',
        {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 2,
        }
      ).format(
        Number(value || 0)
      );

    };


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate =
    (value: any) => {

      if (!value) {
        return '-';
      }


      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return '-';

      }


      return date.toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      );

    };


  // ==========================================================
  // FORMAT DATETIME
  // ==========================================================

  const formatDateTime =
    (value: any) => {

      if (!value) {
        return '-';
      }


      const date =
        new Date(value);


      if (
        Number.isNaN(
          date.getTime()
        )
      ) {

        return '-';

      }


      return date.toLocaleString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }
      );

    };


  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const StatusBadge =
    ({
      status,
    }: {
      status: string;
    }) => {

      const normalized =
        String(status || '')
          .toLowerCase();


      let className =
        'bg-gray-100 text-gray-700';


      if (
        [
          'paid',
          'resolved',
          'working',
        ].includes(normalized)
      ) {

        className =
          'bg-green-100 text-green-700';

      }


      if (
        [
          'pending',
          'open',
          'active',
          'under_maintenance',
          'in-progress',
        ].includes(normalized)
      ) {

        className =
          'bg-yellow-100 text-yellow-700';

      }


      if (
        [
          'overdue',
          'not_working',
        ].includes(normalized)
      ) {

        className =
          'bg-red-100 text-red-700';

      }


      return (

        <span
          className={`
            inline-flex
            rounded-full
            px-2.5
            py-1
            text-xs
            font-semibold
            ${className}
          `}
        >

          {String(status || '-')
            .replaceAll('_', ' ')
            .replace(
              /\b\w/g,
              char =>
                char.toUpperCase()
            )}

        </span>

      );

    };


  // ==========================================================
  // ACCESS CONTROL
  // ==========================================================

  if (
    user &&
    !canViewReports
  ) {

    return (

      <div
        className="
          flex
          min-h-[60vh]
          items-center
          justify-center
          px-4
        "
      >

        <Card
          className="
            w-full
            max-w-md
          "
        >

          <CardContent
            className="
              p-6
              text-center
            "
          >

            <AlertTriangle
              className="
                mx-auto
                mb-3
                h-10
                w-10
                text-red-500
              "
            />

            <h2
              className="
                text-lg
                font-semibold
                text-slate-900
              "
            >
              Access Denied
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
              "
            >
              Reports are available only to
              Manager, Admin and Super Admin.
            </p>

          </CardContent>

        </Card>

      </div>

    );

  }


  // ==========================================================
  // CURRENT REPORT CONFIG
  // ==========================================================

  const CurrentIcon =
    reportConfig[reportType].icon;


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="
        w-full
        min-w-0
        space-y-6
        p-4
        md:p-6
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >

        <div>

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                rounded-xl
                bg-blue-100
                p-3
              "
            >

              <FileText
                className="
                  h-7
                  w-7
                  text-blue-600
                "
              />

            </div>


            <div>

              <h1
                className="
                  text-2xl
                  font-bold
                  text-gray-900
                  sm:text-3xl
                "
              >
                Reports
              </h1>

              <p
                className="
                  mt-1
                  text-sm
                  text-gray-500
                "
              >
                View society reports and download
                maintenance reports.
              </p>

            </div>

          </div>

        </div>


        {/* REFRESH */}

        <Button
          type="button"
          variant="outline"
          onClick={
            handleLoadReport
          }
          disabled={
            loadingReport
          }
        >

          {loadingReport ? (

            <Loader2
              className="
                mr-2
                h-4
                w-4
                animate-spin
              "
            />

          ) : (

            <RefreshCw
              className="
                mr-2
                h-4
                w-4
              "
            />

          )}

          Refresh

        </Button>

      </div>


      {/* ======================================================
          SOCIETY SELECTOR
      ====================================================== */}

      <Card>

        <CardContent
          className="
            p-5
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              lg:flex-row
              lg:items-end
            "
          >

            {/* SOCIETY */}

            <div
              className="
                flex-1
              "
            >

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Society
              </label>


              {isSuperAdmin ? (

                <div
                  className="
                    relative
                  "
                >

                  <Building2
                    className="
                      pointer-events-none
                      absolute
                      left-3
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                  <select
                    value={
                      selectedSocietyId
                    }
                    onChange={
                      event =>
                        setSelectedSocietyId(
                          event.target.value
                        )
                    }
                    disabled={
                      loadingSocieties ||
                      loadingReport
                    }
                    className="
                      w-full
                      appearance-none
                      rounded-lg
                      border
                      border-gray-300
                      bg-white
                      py-2.5
                      pl-10
                      pr-10
                      text-sm
                      outline-none
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  >

                    <option value="all">
                      All Societies
                    </option>

                    {societies.map(
                      society => (

                        <option
                          key={
                            society._id
                          }
                          value={
                            society._id
                          }
                        >
                          {society.name}

                          {society.society_code
                            ? ` (${society.society_code})`
                            : ''}
                        </option>

                      )
                    )}

                  </select>


                  <ChevronDown
                    className="
                      pointer-events-none
                      absolute
                      right-3
                      top-1/2
                      h-4
                      w-4
                      -translate-y-1/2
                      text-gray-400
                    "
                  />

                </div>

              ) : (

                <div
                  className="
                    rounded-lg
                    border
                    border-gray-200
                    bg-gray-50
                    px-4
                    py-2.5
                    text-sm
                    font-medium
                    text-gray-800
                  "
                >

                  {(
                    user as typeof user & {
                      society_name?: string;
                      society?: {
                        name?: string;
                        society_code?: string;
                      };
                    }
                  )?.society_name ||
                    (
                      user as typeof user & {
                        society?: {
                          name?: string;
                        };
                      }
                    )?.society?.name ||
                    'My Society'}

                </div>

              )}

            </div>


            {/* REPORT TYPE */}

            <div
              className="
                flex-1
              "
            >

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Report Type
              </label>


              <div
                className="
                  relative
                "
              >

                <CurrentIcon
                  className="
                    pointer-events-none
                    absolute
                    left-3
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-gray-400
                  "
                />


                <select
                  value={
                    reportType
                  }
                  onChange={
                    event => {

                      setReportType(
                        event.target.value as ReportType
                      );

                      setReport(
                        null
                      );

                      setError('');

                    }
                  }
                  disabled={
                    loadingReport
                  }
                  className="
                    w-full
                    appearance-none
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    py-2.5
                    pl-10
                    pr-10
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                >

                  <option value="maintenance">
                    Maintenance Report
                  </option>

                  <option value="complaints">
                    Complaint Report
                  </option>

                  <option value="emergency">
                    Emergency Report
                  </option>

                  <option value="users">
                    Users / Residents Report
                  </option>

                  <option value="assets">
                    Assets Report
                  </option>

                </select>


                <ChevronDown
                  className="
                    pointer-events-none
                    absolute
                    right-3
                    top-1/2
                    h-4
                    w-4
                    -translate-y-1/2
                    text-gray-400
                  "
                />

              </div>

            </div>


            {/* LOAD BUTTON */}

            <div>

              <Button
                type="button"
                onClick={
                  handleLoadReport
                }
                disabled={
                  loadingReport ||
                  loadingSocieties
                }
                className="
                  w-full
                  bg-blue-600
                  hover:bg-blue-700
                  lg:w-auto
                "
              >

                {loadingReport ? (

                  <>

                    <Loader2
                      className="
                        mr-2
                        h-4
                        w-4
                        animate-spin
                      "
                    />

                    Loading...

                  </>

                ) : (

                  <>

                    <BarChart3
                      className="
                        mr-2
                        h-4
                        w-4
                      "
                    />

                    Generate Report

                  </>

                )}

              </Button>

            </div>

          </div>

        </CardContent>

      </Card>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <Card>

        <CardHeader>

          <CardTitle
            className="
              text-base
            "
          >
            Report Filters
          </CardTitle>

        </CardHeader>


        <CardContent>

          {/* MAINTENANCE FILTERS */}

          {reportType === 'maintenance' && (

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Month
                </label>

                <select
                  value={
                    selectedMonth
                  }
                  onChange={
                    event =>
                      setSelectedMonth(
                        event.target.value
                      )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                  "
                >

                  {[
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
                  ].map(
                    (month, index) => (

                      <option
                        key={month}
                        value={
                          String(index + 1)
                        }
                      >
                        {month}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Year
                </label>

                <select
                  value={
                    selectedYear
                  }
                  onChange={
                    event =>
                      setSelectedYear(
                        event.target.value
                      )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                  "
                >

                  {[2026, 2025, 2024].map(
                    year => (

                      <option
                        key={year}
                        value={
                          String(year)
                        }
                      >
                        {year}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Payment Status
                </label>

                <select
                  value={
                    maintenanceStatus
                  }
                  onChange={
                    event =>
                      setMaintenanceStatus(
                        event.target.value
                      )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                  "
                >

                  <option value="all">
                    All
                  </option>

                  <option value="paid">
                    Paid
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="overdue">
                    Overdue
                  </option>

                </select>

              </div>

            </div>

          )}


          {/* COMPLAINT FILTER */}

          {reportType === 'complaints' && (

            <div
              className="
                max-w-sm
              "
            >

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Complaint Status
              </label>

              <select
                value={
                  complaintStatus
                }
                onChange={
                  event =>
                    setComplaintStatus(
                      event.target.value
                    )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                "
              >

                <option value="all">
                  All Complaints
                </option>

                <option value="open">
                  Open
                </option>

                <option value="in-progress">
                  In Progress
                </option>

                <option value="resolved">
                  Resolved
                </option>

              </select>

            </div>

          )}


          {/* EMERGENCY FILTER */}

          {reportType === 'emergency' && (

            <div
              className="
                max-w-sm
              "
            >

              <label
                className="
                  mb-2
                  block
                  text-sm
                  font-medium
                  text-gray-700
                "
              >
                Emergency Status
              </label>

              <select
                value={
                  emergencyStatus
                }
                onChange={
                  event =>
                    setEmergencyStatus(
                      event.target.value
                    )
                }
                className="
                  w-full
                  rounded-lg
                  border
                  border-gray-300
                  bg-white
                  px-3
                  py-2.5
                  text-sm
                "
              >

                <option value="all">
                  All Emergencies
                </option>

                <option value="active">
                  Active
                </option>

                <option value="resolved">
                  Resolved
                </option>

              </select>

            </div>

          )}


          {/* USERS FILTER */}

          {reportType === 'users' && (

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Role
                </label>

                <select
                  value={
                    userRole
                  }
                  onChange={
                    event =>
                      setUserRole(
                        event.target.value
                      )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                  "
                >

                  <option value="all">
                    All Users
                  </option>

                  <option value="resident">
                    Residents
                  </option>

                  <option value="manager">
                    Managers
                  </option>

                  <option value="admin">
                    Admins
                  </option>

                  <option value="watchman">
                    Watchmen
                  </option>

                </select>

              </div>


              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  User Status
                </label>

                <select
                  value={
                    userActive
                  }
                  onChange={
                    event =>
                      setUserActive(
                        event.target.value
                      )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                  "
                >

                  <option value="all">
                    All Users
                  </option>

                  <option value="true">
                    Active
                  </option>

                  <option value="false">
                    Inactive
                  </option>

                </select>

              </div>

            </div>

          )}


          {/* ASSETS FILTER */}

          {reportType === 'assets' && (

            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >

              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Asset Type
                </label>

                <select
                  value={
                    assetType
                  }
                  onChange={
                    event =>
                      setAssetType(
                        event.target.value
                      )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                  "
                >

                  <option value="all">
                    All Assets
                  </option>

                  <option value="lift">
                    Lift
                  </option>

                  <option value="water_pump">
                    Water Pump
                  </option>

                  <option value="generator">
                    Generator
                  </option>

                </select>

              </div>


              <div>

                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-gray-700
                  "
                >
                  Asset Status
                </label>

                <select
                  value={
                    assetStatus
                  }
                  onChange={
                    event =>
                      setAssetStatus(
                        event.target.value
                      )
                  }
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-300
                    bg-white
                    px-3
                    py-2.5
                    text-sm
                  "
                >

                  <option value="all">
                    All Status
                  </option>

                  <option value="working">
                    Working
                  </option>

                  <option value="under_maintenance">
                    Under Maintenance
                  </option>

                  <option value="not_working">
                    Not Working
                  </option>

                </select>

              </div>

            </div>

          )}

        </CardContent>

      </Card>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (

        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            p-4
            text-sm
            text-red-700
          "
        >

          {error}

        </div>

      )}


      {/* ======================================================
          REPORT RESULT
      ====================================================== */}

      {report && (

        <>

          {/* ==================================================
              REPORT TITLE
          ================================================== */}

          <Card>

            <CardHeader>

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >

                <div>

                  <CardTitle
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <CurrentIcon
                      className="
                        h-5
                        w-5
                        text-blue-600
                      "
                    />

                    {
                      reportConfig[
                        reportType
                      ].title
                    }

                  </CardTitle>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-gray-500
                    "
                  >
                    {
                      reportConfig[
                        reportType
                      ].description
                    }
                  </p>

                </div>


                {/* MAINTENANCE PDF */}

                {reportType === 'maintenance' && (

                  <Button
                    type="button"
                    onClick={
                      handleMaintenancePDF
                    }
                    disabled={
                      loadingReport
                    }
                    variant="outline"
                  >

                    <Download
                      className="
                        mr-2
                        h-4
                        w-4
                      "
                    />

                    Download PDF

                  </Button>

                )}

              </div>

            </CardHeader>

          </Card>


          {/* ==================================================
              MAINTENANCE
          ================================================== */}

          {reportType === 'maintenance' && (

            <>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >

                <SummaryCard
                  title="Total Records"
                  value={
                    report.summary?.totalRecords ?? 0
                  }
                  icon={
                    <FileText
                      className="
                        h-6
                        w-6
                        text-blue-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Paid"
                  value={
                    report.summary?.paid ?? 0
                  }
                  icon={
                    <CheckCircle
                      className="
                        h-6
                        w-6
                        text-green-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Pending"
                  value={
                    report.summary?.pending ?? 0
                  }
                  icon={
                    <Clock
                      className="
                        h-6
                        w-6
                        text-yellow-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Overdue"
                  value={
                    report.summary?.overdue ?? 0
                  }
                  icon={
                    <AlertTriangle
                      className="
                        h-6
                        w-6
                        text-red-600
                      "
                    />
                  }
                />

              </div>


              <Card>

                <CardHeader>

                  <CardTitle>
                    Maintenance Summary
                  </CardTitle>

                </CardHeader>


                <CardContent>

                  <div
                    className="
                      grid
                      gap-4
                      sm:grid-cols-2
                      lg:grid-cols-4
                    "
                  >

                    <AmountBox
                      title="Total Expected"
                      value={
                        report.summary?.totalExpected
                      }
                    />

                    <AmountBox
                      title="Total Collected"
                      value={
                        report.summary?.totalCollected
                      }
                    />

                    <AmountBox
                      title="Pending Amount"
                      value={
                        report.summary?.totalPending
                      }
                    />

                    <AmountBox
                      title="Late Fee"
                      value={
                        report.summary?.totalLateFee
                      }
                    />

                  </div>

                </CardContent>

              </Card>


              <Card>

                <CardHeader>

                  <CardTitle>
                    Maintenance Records
                  </CardTitle>

                </CardHeader>


                <CardContent>

                  <ResponsiveTable>

                    <table
                      className="
                        w-full
                        text-left
                        text-sm
                      "
                    >

                      <thead
                        className="
                          border-b
                          bg-gray-50
                        "
                      >

                        <tr>

                          <th className="px-4 py-3">
                            Flat
                          </th>

                          <th className="px-4 py-3">
                            Resident
                          </th>

                          <th className="px-4 py-3">
                            Month
                          </th>

                          <th className="px-4 py-3">
                            Amount
                          </th>

                          <th className="px-4 py-3">
                            Late Fee
                          </th>

                          <th className="px-4 py-3">
                            Total
                          </th>

                          <th className="px-4 py-3">
                            Due Date
                          </th>

                          <th className="px-4 py-3">
                            Status
                          </th>

                        </tr>

                      </thead>


                      <tbody
                        className="
                          divide-y
                        "
                      >

                        {(report.records || []).map(
                          (record, index) => (

                            <tr
                              key={
                                record._id ||
                                index
                              }
                              className="
                                hover:bg-gray-50
                              "
                            >

                              <td className="px-4 py-3 font-medium">

                                {record.flat_no || '-'}

                              </td>


                              <td className="px-4 py-3">

                                {record.user_id?.name || '-'}

                              </td>


                              <td className="px-4 py-3">

                                {record.month || '-'}
                                /
                                {record.year || '-'}

                              </td>


                              <td className="px-4 py-3">

                                {formatCurrency(
                                  record.amount
                                )}

                              </td>


                              <td className="px-4 py-3">

                                {formatCurrency(
                                  record.late_fee
                                )}

                              </td>


                              <td className="px-4 py-3 font-semibold">

                                {formatCurrency(
                                  record.total_amount
                                )}

                              </td>


                              <td className="px-4 py-3">

                                {formatDate(
                                  record.due_date
                                )}

                              </td>


                              <td className="px-4 py-3">

                                <StatusBadge
                                  status={
                                    record.status
                                  }
                                />

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </ResponsiveTable>

                </CardContent>

              </Card>

            </>

          )}


          {/* ==================================================
              COMPLAINTS
          ================================================== */}

          {reportType === 'complaints' && (

            <>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >

                <SummaryCard
                  title="Total Complaints"
                  value={
                    report.summary?.total_complaints ??
                    0
                  }
                  icon={
                    <MessageSquare
                      className="
                        h-6
                        w-6
                        text-blue-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Open"
                  value={
                    report.summary?.open ??
                    0
                  }
                  icon={
                    <Clock
                      className="
                        h-6
                        w-6
                        text-yellow-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="In Progress"
                  value={
                    report.summary?.in_progress ??
                    0
                  }
                  icon={
                    <RefreshCw
                      className="
                        h-6
                        w-6
                        text-blue-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Resolved"
                  value={
                    report.summary?.resolved ??
                    0
                  }
                  icon={
                    <CheckCircle
                      className="
                        h-6
                        w-6
                        text-green-600
                      "
                    />
                  }
                />

              </div>


              <Card>

                <CardHeader>

                  <CardTitle>
                    Complaint Records
                  </CardTitle>

                </CardHeader>


                <CardContent>

                  <ResponsiveTable>

                    <table
                      className="
                        w-full
                        text-left
                        text-sm
                      "
                    >

                      <thead
                        className="
                          border-b
                          bg-gray-50
                        "
                      >

                        <tr>

                          <th className="px-4 py-3">
                            Resident
                          </th>

                          <th className="px-4 py-3">
                            Flat
                          </th>

                          <th className="px-4 py-3">
                            Description
                          </th>

                          <th className="px-4 py-3">
                            Date
                          </th>

                          <th className="px-4 py-3">
                            Status
                          </th>

                        </tr>

                      </thead>


                      <tbody className="divide-y">

                        {(report.records || []).map(
                          (record, index) => (

                            <tr
                              key={
                                record._id ||
                                index
                              }
                              className="hover:bg-gray-50"
                            >

                              <td className="px-4 py-3">

                                <div>

                                  <p className="font-medium">

                                    {
                                      record.user_id?.name ||
                                      '-'
                                    }

                                  </p>

                                  <p className="text-xs text-gray-500">

                                    {
                                      record.user_id?.email ||
                                      ''
                                    }

                                  </p>

                                </div>

                              </td>


                              <td className="px-4 py-3">

                                {record.flat_no || '-'}

                              </td>


                              <td className="max-w-sm px-4 py-3">

                                <p className="truncate">

                                  {
                                    record.description ||
                                    '-'
                                  }

                                </p>

                              </td>


                              <td className="px-4 py-3">

                                {formatDate(
                                  record.created_at
                                )}

                              </td>


                              <td className="px-4 py-3">

                                <StatusBadge
                                  status={
                                    record.status
                                  }
                                />

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </ResponsiveTable>

                </CardContent>

              </Card>

            </>

          )}


          {/* ==================================================
              EMERGENCY
          ================================================== */}

          {reportType === 'emergency' && (

            <>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-3
                "
              >

                <SummaryCard
                  title="Total Emergencies"
                  value={
                    report.summary?.total_emergencies ??
                    0
                  }
                  icon={
                    <Siren
                      className="
                        h-6
                        w-6
                        text-red-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Active"
                  value={
                    report.summary?.active ??
                    0
                  }
                  icon={
                    <AlertTriangle
                      className="
                        h-6
                        w-6
                        text-yellow-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Resolved"
                  value={
                    report.summary?.resolved ??
                    0
                  }
                  icon={
                    <CheckCircle
                      className="
                        h-6
                        w-6
                        text-green-600
                      "
                    />
                  }
                />

              </div>


              <Card>

                <CardHeader>

                  <CardTitle>
                    Emergency Records
                  </CardTitle>

                </CardHeader>


                <CardContent>

                  <ResponsiveTable>

                    <table
                      className="
                        w-full
                        text-left
                        text-sm
                      "
                    >

                      <thead
                        className="
                          border-b
                          bg-gray-50
                        "
                      >

                        <tr>

                          <th className="px-4 py-3">
                            Resident
                          </th>

                          <th className="px-4 py-3">
                            Flat
                          </th>

                          <th className="px-4 py-3">
                            Triggered
                          </th>

                          <th className="px-4 py-3">
                            Status
                          </th>

                          <th className="px-4 py-3">
                            Resolved
                          </th>

                          <th className="px-4 py-3">
                            Details
                          </th>

                        </tr>

                      </thead>


                      <tbody className="divide-y">

                        {(report.records || []).map(
                          (record, index) => (

                            <tr
                              key={
                                record._id ||
                                index
                              }
                              className="hover:bg-gray-50"
                            >

                              <td className="px-4 py-3">

                                {
                                  record.triggered_by?.name ||
                                  '-'
                                }

                              </td>


                              <td className="px-4 py-3">

                                {record.flat_no || '-'}

                              </td>


                              <td className="px-4 py-3">

                                {formatDateTime(
                                  record.triggered_at
                                )}

                              </td>


                              <td className="px-4 py-3">

                                <StatusBadge
                                  status={
                                    record.status
                                  }
                                />

                              </td>


                              <td className="px-4 py-3">

                                {formatDateTime(
                                  record.resolved_at
                                )}

                              </td>


                              <td className="max-w-xs px-4 py-3">

                                <p className="truncate">

                                  {
                                    record.notes ||
                                    '-'
                                  }

                                </p>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </ResponsiveTable>

                </CardContent>

              </Card>

            </>

          )}


          {/* ==================================================
              USERS
          ================================================== */}

          {reportType === 'users' && (

            <>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >

                <SummaryCard
                  title="Total Users"
                  value={
                    report.summary?.total_users ??
                    0
                  }
                  icon={
                    <Users
                      className="
                        h-6
                        w-6
                        text-blue-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Residents"
                  value={
                    report.summary?.residents ??
                    0
                  }
                  icon={
                    <Users
                      className="
                        h-6
                        w-6
                        text-green-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Managers"
                  value={
                    report.summary?.managers ??
                    0
                  }
                  icon={
                    <Building2
                      className="
                        h-6
                        w-6
                        text-purple-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Admins"
                  value={
                    report.summary?.admins ??
                    0
                  }
                  icon={
                    <CheckCircle
                      className="
                        h-6
                        w-6
                        text-orange-600
                      "
                    />
                  }
                />

              </div>


              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                "
              >

                <SummaryCard
                  title="Active Users"
                  value={
                    report.summary?.active ??
                    0
                  }
                  icon={
                    <CheckCircle
                      className="
                        h-6
                        w-6
                        text-green-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Inactive Users"
                  value={
                    report.summary?.inactive ??
                    0
                  }
                  icon={
                    <Clock
                      className="
                        h-6
                        w-6
                        text-gray-500
                      "
                    />
                  }
                />

              </div>


              <Card>

                <CardHeader>

                  <CardTitle>
                    User / Resident Records
                  </CardTitle>

                </CardHeader>


                <CardContent>

                  <ResponsiveTable>

                    <table
                      className="
                        w-full
                        text-left
                        text-sm
                      "
                    >

                      <thead
                        className="
                          border-b
                          bg-gray-50
                        "
                      >

                        <tr>

                          <th className="px-4 py-3">
                            Name
                          </th>

                          <th className="px-4 py-3">
                            Email
                          </th>

                          <th className="px-4 py-3">
                            Phone
                          </th>

                          <th className="px-4 py-3">
                            Flat
                          </th>

                          <th className="px-4 py-3">
                            Role
                          </th>

                          <th className="px-4 py-3">
                            Status
                          </th>

                          {isSuperAdmin && (
                            <th className="px-4 py-3">
                              Society
                            </th>
                          )}

                        </tr>

                      </thead>


                      <tbody className="divide-y">

                        {(report.records || []).map(
                          (record, index) => (

                            <tr
                              key={
                                record._id ||
                                index
                              }
                              className="hover:bg-gray-50"
                            >

                              <td className="px-4 py-3 font-medium">

                                {
                                  record.name ||
                                  '-'
                                }

                              </td>


                              <td className="px-4 py-3">

                                {
                                  record.email ||
                                  '-'
                                }

                              </td>


                              <td className="px-4 py-3">

                                {
                                  record.phone ||
                                  '-'
                                }

                              </td>


                              <td className="px-4 py-3">

                                {
                                  record.flat_no ||
                                  '-'
                                }

                              </td>


                              <td className="px-4 py-3">

                                <span
                                  className="
                                    rounded-full
                                    bg-blue-100
                                    px-2.5
                                    py-1
                                    text-xs
                                    font-semibold
                                    text-blue-700
                                  "
                                >

                                  {
                                    record.role ||
                                    '-'
                                  }

                                </span>

                              </td>


                              <td className="px-4 py-3">

                                <StatusBadge
                                  status={
                                    record.is_active
                                      ? 'active'
                                      : 'inactive'
                                  }
                                />

                              </td>


                              {isSuperAdmin && (

                                <td className="px-4 py-3">

                                  {
                                    record.society_id?.name ||
                                    record.society?.name ||
                                    '-'
                                  }

                                </td>

                              )}

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </ResponsiveTable>

                </CardContent>

              </Card>

            </>

          )}


          {/* ==================================================
              ASSETS
          ================================================== */}

          {reportType === 'assets' && (

            <>

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                  lg:grid-cols-4
                "
              >

                <SummaryCard
                  title="Total Assets"
                  value={
                    report.summary?.total_assets ??
                    0
                  }
                  icon={
                    <Wrench
                      className="
                        h-6
                        w-6
                        text-blue-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Working"
                  value={
                    report.summary?.working ??
                    report.summary?.by_status?.working ??
                    0
                  }
                  icon={
                    <CheckCircle
                      className="
                        h-6
                        w-6
                        text-green-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Under Maintenance"
                  value={
                    report.summary?.under_maintenance ??
                    report.summary?.by_status?.under_maintenance ??
                    0
                  }
                  icon={
                    <Clock
                      className="
                        h-6
                        w-6
                        text-yellow-600
                      "
                    />
                  }
                />


                <SummaryCard
                  title="Not Working"
                  value={
                    report.summary?.not_working ??
                    report.summary?.by_status?.not_working ??
                    0
                  }
                  icon={
                    <AlertTriangle
                      className="
                        h-6
                        w-6
                        text-red-600
                      "
                    />
                  }
                />

              </div>


              <Card>

                <CardHeader>

                  <CardTitle>
                    Asset Records
                  </CardTitle>

                </CardHeader>


                <CardContent>

                  <ResponsiveTable>

                    <table
                      className="
                        w-full
                        text-left
                        text-sm
                      "
                    >

                      <thead
                        className="
                          border-b
                          bg-gray-50
                        "
                      >

                        <tr>

                          <th className="px-4 py-3">
                            Asset
                          </th>

                          <th className="px-4 py-3">
                            Type
                          </th>

                          <th className="px-4 py-3">
                            Status
                          </th>

                          <th className="px-4 py-3">
                            Location
                          </th>

                          <th className="px-4 py-3">
                            Last Service
                          </th>

                          <th className="px-4 py-3">
                            Services
                          </th>

                          {isSuperAdmin && (
                            <th className="px-4 py-3">
                              Society
                            </th>
                          )}

                        </tr>

                      </thead>


                      <tbody className="divide-y">

                        {(report.records || []).map(
                          (record, index) => (

                            <tr
                              key={
                                record._id ||
                                index
                              }
                              className="hover:bg-gray-50"
                            >

                              <td className="px-4 py-3 font-medium">

                                {
                                  record.name ||
                                  '-'
                                }

                              </td>


                              <td className="px-4 py-3">

                                {
                                  String(
                                    record.type ||
                                    '-'
                                  ).replaceAll(
                                    '_',
                                    ' '
                                  )
                                }

                              </td>


                              <td className="px-4 py-3">

                                <StatusBadge
                                  status={
                                    record.status
                                  }
                                />

                              </td>


                              <td className="px-4 py-3">

                                {
                                  record.location ||
                                  '-'
                                }

                              </td>


                              <td className="px-4 py-3">

                                {formatDate(
                                  record.last_service_date
                                )}

                              </td>


                              <td className="px-4 py-3">

                                {
                                  Array.isArray(
                                    record.services
                                  )
                                    ? record.services.length
                                    : 0
                                }

                              </td>


                              {isSuperAdmin && (

                                <td className="px-4 py-3">

                                  {
                                    record.society_id?.name ||
                                    record.society?.name ||
                                    '-'
                                  }

                                </td>

                              )}

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </ResponsiveTable>

                </CardContent>

              </Card>

            </>

          )}

        </>

      )}


      {/* ======================================================
          NO REPORT YET
      ====================================================== */}

      {!report &&
        !loadingReport &&
        !error && (

          <Card>

            <CardContent
              className="
                flex
                min-h-[250px]
                flex-col
                items-center
                justify-center
                p-8
                text-center
              "
            >

              <div
                className="
                  rounded-full
                  bg-blue-50
                  p-4
                "
              >

                <FileText
                  className="
                    h-10
                    w-10
                    text-blue-500
                  "
                />

              </div>


              <h2
                className="
                  mt-4
                  text-lg
                  font-semibold
                  text-gray-900
                "
              >
                Generate a Report
              </h2>


              <p
                className="
                  mt-1
                  max-w-md
                  text-sm
                  text-gray-500
                "
              >
                Select the report type, apply the
                required filters and click
                Generate Report.
              </p>

            </CardContent>

          </Card>

        )}

    </div>

  );

}


// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: any;
  icon: React.ReactNode;
}) {

  return (

    <Card>

      <CardContent
        className="
          p-5
        "
      >

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          <div>

            <p
              className="
                text-sm
                text-gray-500
              "
            >
              {title}
            </p>


            <p
              className="
                mt-1
                text-2xl
                font-bold
                text-gray-900
              "
            >
              {value ?? 0}
            </p>

          </div>


          <div
            className="
              rounded-xl
              bg-gray-50
              p-3
            "
          >

            {icon}

          </div>

        </div>

      </CardContent>

    </Card>

  );

}


// ============================================================
// AMOUNT BOX
// ============================================================

function AmountBox({
  title,
  value,
}: {
  title: string;
  value: any;
}) {

  return (

    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-gray-50
        p-4
      "
    >

      <p
        className="
          text-xs
          text-gray-500
        "
      >
        {title}
      </p>


      <p
        className="
          mt-1
          text-lg
          font-bold
          text-gray-900
        "
      >

        {new Intl.NumberFormat(
          'en-IN',
          {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
          }
        ).format(
          Number(value || 0)
        )}

      </p>

    </div>

  );

}


// ============================================================
// RESPONSIVE TABLE
// ============================================================

function ResponsiveTable({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <div
      className="
        w-full
        overflow-x-auto
      "
    >

      {children}

    </div>

  );

}