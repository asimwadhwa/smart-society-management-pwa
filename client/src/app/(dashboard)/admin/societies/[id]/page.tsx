'use client';

import {
  useEffect,
  useState
} from 'react';

import {
  useParams,
  useRouter
} from 'next/navigation';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import {
  Building2,
  Users,
  UserCog,
  Crown,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Loader2,
  ShieldCheck,
  UserRoundCog,
  UserMinus,
  UserPlus
} from 'lucide-react';

interface Society {
  _id: string;
  name: string;
  society_code: string;
  address: string;
  city: string;
  state: string;
  contact_number: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SocietyStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  residents: number;
  admins: number;
  managers: number;
  watchmen: number;
}

interface Manager {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  flat_no?: string;
  role?: string;
  is_active?: boolean;
}

interface SocietyUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  flat_no?: string;
  role: string;
  is_active: boolean;
}

interface ManagerForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  flat_no: string;
}

const emptyManagerForm: ManagerForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  flat_no: ''
};

export default function SocietyDetailsPage() {

  const params =
    useParams();

  const router =
    useRouter();

  const {
    user,
    loading: authLoading
  } = useAuth();

  const {
    toast
  } = useToast();

  const societyId =
    typeof params?.id === 'string'
      ? params.id
      : '';

  const [
    society,
    setSociety
  ] =
    useState<Society | null>(
      null
    );

  const [
    stats,
    setStats
  ] =
    useState<SocietyStats | null>(
      null
    );

  const [
    manager,
    setManager
  ] =
    useState<Manager | null>(
      null
    );

  const [
    societyUsers,
    setSocietyUsers
  ] =
    useState<SocietyUser[]>(
      []
    );

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing
  ] =
    useState(false);

  const [
    showManagerForm,
    setShowManagerForm
  ] =
    useState(false);

  const [
    managerMode,
    setManagerMode
  ] =
    useState<
      'new' | 'existing'
    >('existing');

  const [
    selectedUserId,
    setSelectedUserId
  ] =
    useState('');

  const [
    managerForm,
    setManagerForm
  ] =
    useState<ManagerForm>(
      emptyManagerForm
    );

  const [
    savingManager,
    setSavingManager
  ] =
    useState(false);

  const [
    removingManager,
    setRemovingManager
  ] =
    useState(false);

  const isSuperAdmin =
    user?.role ===
    'super_admin';

  // ============================================================
  // LOAD SOCIETY
  // ============================================================

  const fetchSociety = async (
    showRefresh = false
  ) => {

    if (!societyId) {
      return;
    }

    try {

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [
        societyResponse,
        statsResponse,
        managerResponse,
        usersResponse
      ] =
        await Promise.all([

          api.get(
            `/societies/${societyId}`
          ),

          api.get(
            `/societies/${societyId}/stats`
          ),

          api.get(
            `/societies/${societyId}/manager`
          ),

          api.get(
            `/users?society_id=${societyId}&limit=100`
          )
        ]);

      if (
        !societyResponse.data?.success
      ) {
        throw new Error(
          societyResponse.data?.message ||
            'Failed to load society'
        );
      }

      setSociety(
        societyResponse.data.data
      );

      setStats(
        statsResponse.data?.success
          ? statsResponse.data.data
          : null
      );

      setManager(
        managerResponse.data?.success
          ? managerResponse.data.data ||
              null
          : null
      );

      setSocietyUsers(
        usersResponse.data?.success
          ? usersResponse.data.data ||
              []
          : []
      );

    } catch (error: any) {

      console.error(
        'Failed to load society:',
        error
      );

      toast({
        title:
          'Unable to load society',

        description:
          error?.response?.data
            ?.message ||
          error?.message ||
          'Please try again.',

        variant:
          'destructive'
      });

    } finally {

      setLoading(false);
      setRefreshing(false);
    }
  };

  // ============================================================
  // AUTH
  // ============================================================

  useEffect(() => {

    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace(
        '/login'
      );
      return;
    }

    if (!isSuperAdmin) {
      router.replace('/');
      return;
    }

    fetchSociety();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    authLoading,
    user,
    societyId
  ]);

  // ============================================================
  // AVAILABLE USERS
  // ============================================================

  const availableManagerUsers =
    societyUsers.filter(
      item =>
        item.is_active &&
        (
          item.role ===
            'resident' ||
          item.role ===
            'admin'
        )
    );

  // ============================================================
  // OPEN MANAGER FORM
  // ============================================================

  const openManagerForm =
    () => {

      if (!society) {
        return;
      }

      if (
        !society.is_active
      ) {
        toast({
          title:
            'Society inactive',

          description:
            'Activate the society before assigning a manager.',

          variant:
            'destructive'
        });

        return;
      }

      setManagerMode(
        availableManagerUsers.length >
          0
          ? 'existing'
          : 'new'
      );

      setSelectedUserId(
        ''
      );

      setManagerForm(
        emptyManagerForm
      );

      setShowManagerForm(
        true
      );
    };

  // ============================================================
  // CLOSE MANAGER FORM
  // ============================================================

  const closeManagerForm =
    () => {

      if (
        savingManager
      ) {
        return;
      }

      setShowManagerForm(
        false
      );

      setSelectedUserId(
        ''
      );

      setManagerForm(
        emptyManagerForm
      );
    };

  // ============================================================
  // MANAGER INPUT
  // ============================================================

  const handleManagerInput =
    (
      field: keyof ManagerForm,
      value: string
    ) => {

      setManagerForm(
        previous => ({
          ...previous,
          [field]:
            value
        })
      );
    };

  // ============================================================
  // ASSIGN / CHANGE MANAGER
  // ============================================================

  const saveManager =
    async (
      event: React.FormEvent
    ) => {

      event.preventDefault();

      if (!society) {
        return;
      }

      try {

        setSavingManager(
          true
        );

        let payload:
          Record<
            string,
            string
          >;

        // ------------------------------------------------------
        // EXISTING USER
        // ------------------------------------------------------

        if (
          managerMode ===
          'existing'
        ) {

          if (
            !selectedUserId
          ) {

            toast({
              title:
                'Select a user',

              description:
                'Please select an active resident or admin.',

              variant:
                'destructive'
            });

            return;
          }

          payload = {
            user_id:
              selectedUserId
          };

        }

        // ------------------------------------------------------
        // NEW MANAGER
        // ------------------------------------------------------

        else {

          payload = {
            name:
              managerForm.name.trim(),

            email:
              managerForm.email
                .trim()
                .toLowerCase(),

            password:
              managerForm.password,

            phone:
              managerForm.phone.trim(),

            flat_no:
              managerForm.flat_no.trim()
          };

          if (
            !payload.name ||
            !payload.email ||
            !payload.password ||
            !payload.phone ||
            !payload.flat_no
          ) {

            toast({
              title:
                'Required fields missing',

              description:
                'Please fill all manager details.',

              variant:
                'destructive'
            });

            return;
          }

          if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
              payload.email
            )
          ) {

            toast({
              title:
                'Invalid email',

              description:
                'Please enter a valid email address.',

              variant:
                'destructive'
            });

            return;
          }

          if (
            payload.password.length <
            8
          ) {

            toast({
              title:
                'Invalid password',

              description:
                'Password must be at least 8 characters.',

              variant:
                'destructive'
            });

            return;
          }

          if (
            !/^[6-9]\d{9}$/.test(
              payload.phone
            )
          ) {

            toast({
              title:
                'Invalid phone number',

              description:
                'Enter a valid 10-digit Indian mobile number.',

              variant:
                'destructive'
            });

            return;
          }
        }

        const response =
          await api.put(
            `/societies/${society._id}/manager`,
            payload
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              'Failed to assign manager'
          );
        }

        toast({
          title:
            manager
              ? 'Manager changed successfully'
              : 'Manager assigned successfully',

          description:
            response.data.message
        });

        closeManagerForm();

        await fetchSociety(
          true
        );

      } catch (error: any) {

        console.error(
          'Manager update error:',
          error
        );

        toast({
          title:
            'Manager update failed',

          description:
            error?.response?.data
              ?.message ||
            error?.message ||
            'Unable to update manager.',

          variant:
            'destructive'
        });

      } finally {

        setSavingManager(
          false
        );
      }
    };

  // ============================================================
  // REMOVE MANAGER
  // ============================================================

  const removeManager =
    async () => {

      if (
        !society ||
        !manager
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          `Remove ${manager.name || 'current manager'} as manager of ${society.name}?`
        );

      if (!confirmed) {
        return;
      }

      try {

        setRemovingManager(
          true
        );

        const response =
          await api.delete(
            `/societies/${society._id}/manager`
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              'Failed to remove manager'
          );
        }

        toast({
          title:
            'Manager removed',

          description:
            response.data.message
        });

        await fetchSociety(
          true
        );

      } catch (error: any) {

        console.error(
          'Remove manager error:',
          error
        );

        toast({
          title:
            'Unable to remove manager',

          description:
            error?.response?.data
              ?.message ||
            error?.message ||
            'Please try again.',

          variant:
            'destructive'
        });

      } finally {

        setRemovingManager(
          false
        );
      }
    };

  // ============================================================
  // LOADING
  // ============================================================

  if (
    authLoading ||
    loading
  ) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <div className="text-center">

          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />

          <p className="mt-4 text-slate-500 font-medium">
            Loading society...
          </p>

        </div>

      </div>
    );
  }

  if (
    !user ||
    !isSuperAdmin
  ) {
    return null;
  }

  if (!society) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">

        <div className="text-center">

          <Building2 className="w-14 h-14 text-slate-300 mx-auto" />

          <h2 className="mt-4 text-xl font-bold text-slate-800">
            Society not found
          </h2>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/admin/societies'
              )
            }
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Societies
          </button>

        </div>

      </div>
    );
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="space-y-6 pb-10">

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              router.push(
                '/admin/societies'
              )
            }
            className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Building2 className="w-6 h-6 text-white" />
          </div>

          <div>

            <div className="flex items-center gap-2 flex-wrap">

              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                {society.name}
              </h1>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  society.is_active
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {society.is_active ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}

                {society.is_active
                  ? 'Active'
                  : 'Inactive'}
              </span>

            </div>

            <p className="text-slate-500 mt-1">
              Society Code:{' '}
              <strong>
                {society.society_code}
              </strong>
            </p>

          </div>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              fetchSociety(true)
            }
            disabled={
              refreshing
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            Refresh
          </button>

          <button
            type="button"
            onClick={
              openManagerForm
            }
            disabled={
              !society.is_active
            }
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {manager ? (
              <UserRoundCog className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}

            {manager
              ? 'Change Manager'
              : 'Add Manager'}
          </button>

        </div>

      </div>

      {/* INFO */}

      <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">

        <div className="flex items-start gap-3">

          <ShieldCheck className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />

          <div>

            <p className="font-semibold text-purple-800">
              Super Admin Society Management
            </p>

            <p className="text-sm text-purple-700 mt-1">
              You can assign, change or remove
              the manager of this society.
              Only one manager can be assigned
              at a time.
            </p>

          </div>

        </div>

      </div>

      {/* SOCIETY INFORMATION + MANAGER */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* SOCIETY */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center gap-2 mb-5">

            <Building2 className="w-5 h-5 text-blue-600" />

            <h2 className="font-bold text-slate-900">
              Society Information
            </h2>

          </div>

          <div className="space-y-4">

            <InfoItem
              icon={
                <Building2 className="w-4 h-4" />
              }
              label="Society Name"
              value={
                society.name
              }
            />

            <InfoItem
              icon={
                <ShieldCheck className="w-4 h-4" />
              }
              label="Society Code"
              value={
                society.society_code
              }
            />

            <InfoItem
              icon={
                <MapPin className="w-4 h-4" />
              }
              label="Address"
              value={`${society.address}, ${society.city}, ${society.state}`}
            />

            <InfoItem
              icon={
                <Phone className="w-4 h-4" />
              }
              label="Contact Number"
              value={
                society.contact_number
              }
            />

          </div>

        </div>

        {/* MANAGER */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <div className="flex items-center justify-between gap-3 mb-5">

            <div className="flex items-center gap-2">

              <Crown className="w-5 h-5 text-purple-600" />

              <h2 className="font-bold text-slate-900">
                Society Manager
              </h2>

            </div>

            {manager && (
              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={
                    openManagerForm
                  }
                  disabled={
                    !society.is_active
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                >
                  <UserRoundCog className="w-3.5 h-3.5" />
                  Change
                </button>

                <button
                  type="button"
                  onClick={
                    removeManager
                  }
                  disabled={
                    removingManager
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  {removingManager ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserMinus className="w-3.5 h-3.5" />
                  )}

                  Remove
                </button>

              </div>
            )}

          </div>

          {manager ? (

            <div className="space-y-4">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">

                  <Crown className="w-6 h-6 text-purple-600" />

                </div>

                <div>

                  <p className="font-bold text-slate-900">
                    {manager.name ||
                      'Manager'}
                  </p>

                  <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">

                    <Crown className="w-3 h-3" />

                    Manager

                  </span>

                </div>

              </div>

              <InfoItem
                icon={
                  <Mail className="w-4 h-4" />
                }
                label="Email"
                value={
                  manager.email ||
                  'N/A'
                }
              />

              <InfoItem
                icon={
                  <Phone className="w-4 h-4" />
                }
                label="Phone"
                value={
                  manager.phone ||
                  'N/A'
                }
              />

              <InfoItem
                icon={
                  <MapPin className="w-4 h-4" />
                }
                label="Flat / Office"
                value={
                  manager.flat_no ||
                  'N/A'
                }
              />

              <div className="pt-2">

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    manager.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >

                  {manager.is_active ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <XCircle className="w-3 h-3" />
                  )}

                  {manager.is_active
                    ? 'Active'
                    : 'Inactive'}

                </span>

              </div>

            </div>

          ) : (

            <div className="rounded-xl border border-dashed border-purple-200 bg-purple-50 p-6 text-center">

              <UserCog className="w-10 h-10 mx-auto text-purple-300" />

              <p className="mt-3 font-semibold text-purple-800">
                No Manager Assigned
              </p>

              <p className="mt-1 text-sm text-purple-600">
                Assign an existing society user
                or create a new manager.
              </p>

              <button
                type="button"
                onClick={
                  openManagerForm
                }
                disabled={
                  !society.is_active
                }
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Assign Manager
              </button>

            </div>

          )}

        </div>

      </div>

      {/* STATISTICS */}

      <div>

        <div className="flex items-center gap-2 mb-4">

          <Users className="w-5 h-5 text-blue-600" />

          <h2 className="font-bold text-slate-900">
            Society Statistics
          </h2>

        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">

          <StatCard
            label="Total Users"
            value={
              stats?.totalUsers ||
              0
            }
            icon={
              <Users className="w-5 h-5" />
            }
          />

          <StatCard
            label="Active"
            value={
              stats?.activeUsers ||
              0
            }
            icon={
              <CheckCircle2 className="w-5 h-5" />
            }
          />

          <StatCard
            label="Inactive"
            value={
              stats?.inactiveUsers ||
              0
            }
            icon={
              <XCircle className="w-5 h-5" />
            }
          />

          <StatCard
            label="Managers"
            value={
              stats?.managers ||
              0
            }
            icon={
              <Crown className="w-5 h-5" />
            }
          />

          <StatCard
            label="Admins"
            value={
              stats?.admins ||
              0
            }
            icon={
              <UserCog className="w-5 h-5" />
            }
          />

          <StatCard
            label="Residents"
            value={
              stats?.residents ||
              0
            }
            icon={
              <Users className="w-5 h-5" />
            }
          />

        </div>

      </div>

      {/* QUICK ACTIONS */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

        <h2 className="font-bold text-slate-900 mb-4">
          Quick Actions
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          <button
            type="button"
            onClick={() =>
              router.push(
                `/admin/users?society_id=${society._id}`
              )
            }
            className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left hover:bg-blue-100"
          >

            <Users className="w-5 h-5 text-blue-600" />

            <div>

              <p className="font-semibold text-blue-800">
                Manage Users
              </p>

              <p className="text-xs text-blue-600 mt-0.5">
                View society users
              </p>

            </div>

          </button>

          <button
            type="button"
            onClick={
              openManagerForm
            }
            disabled={
              !society.is_active
            }
            className="flex items-center gap-3 rounded-lg border border-purple-200 bg-purple-50 p-4 text-left hover:bg-purple-100 disabled:opacity-50"
          >

            <UserCog className="w-5 h-5 text-purple-600" />

            <div>

              <p className="font-semibold text-purple-800">
                {manager
                  ? 'Change Manager'
                  : 'Add Manager'}
              </p>

              <p className="text-xs text-purple-600 mt-0.5">
                {manager
                  ? `Current: ${manager.name || 'Manager'}`
                  : 'Assign society manager'}
              </p>

            </div>

          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/admin/societies'
              )
            }
            className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
          >

            <ArrowLeft className="w-5 h-5 text-slate-600" />

            <div>

              <p className="font-semibold text-slate-800">
                All Societies
              </p>

              <p className="text-xs text-slate-500 mt-0.5">
                Back to society management
              </p>

            </div>

          </button>

        </div>

      </div>

      {/* MANAGER MODAL */}

      {showManagerForm && (

        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">

          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4">

              <div>

                <h2 className="text-lg font-bold text-slate-900">

                  {manager
                    ? 'Change Manager'
                    : 'Assign Manager'}

                </h2>

                <p className="text-sm text-slate-500 mt-1">
                  {society.name}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeManagerForm
                }
                disabled={
                  savingManager
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >

                <X className="w-5 h-5" />

              </button>

            </div>

            <form
              onSubmit={
                saveManager
              }
              className="p-5 space-y-5"
            >

              {/* CURRENT MANAGER */}

              {manager && (

                <div className="rounded-lg border border-red-100 bg-red-50 p-4">

                  <div className="flex items-start gap-3">

                    <Crown className="w-5 h-5 text-red-600 mt-0.5" />

                    <div>

                      <p className="text-sm font-semibold text-red-800">
                        Current Manager
                      </p>

                      <p className="text-sm text-red-700 mt-1">
                        {manager.name}
                      </p>

                      <p className="text-xs text-red-600 mt-1">
                        After changing the manager,
                        the current manager will become
                        an inactive resident.
                      </p>

                    </div>

                  </div>

                </div>

              )}

              {/* MODE */}

              <div>

                <p className="text-sm font-semibold text-slate-800 mb-3">
                  Select Manager Type
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <button
                    type="button"
                    onClick={() =>
                      setManagerMode(
                        'existing'
                      )
                    }
                    disabled={
                      availableManagerUsers.length ===
                      0
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      managerMode ===
                      'existing'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    } ${
                      availableManagerUsers.length ===
                      0
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <UserPlus className="w-5 h-5 text-blue-600" />

                      <div>

                        <p className="font-semibold text-slate-900">
                          Existing User
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          Promote resident/admin
                        </p>

                      </div>

                    </div>

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setManagerMode(
                        'new'
                      )
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      managerMode ===
                      'new'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >

                    <div className="flex items-center gap-3">

                      <UserCog className="w-5 h-5 text-purple-600" />

                      <div>

                        <p className="font-semibold text-slate-900">
                          New Manager
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          Create new account
                        </p>

                      </div>

                    </div>

                  </button>

                </div>

              </div>

              {/* EXISTING USER */}

              {managerMode ===
                'existing' && (

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <label className="block">

                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Select Resident / Admin
                    </span>

                    <select
                      value={
                        selectedUserId
                      }
                      onChange={
                        event =>
                          setSelectedUserId(
                            event.target.value
                          )
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >

                      <option value="">
                        Select user
                      </option>

                      {availableManagerUsers.map(
                        item => (
                          <option
                            key={
                              item._id
                            }
                            value={
                              item._id
                            }
                          >
                            {item.name}
                            {' - '}
                            {item.role}
                            {item.flat_no
                              ? ` - Flat ${item.flat_no}`
                              : ''}
                          </option>
                        )
                      )}

                    </select>

                  </label>

                  {availableManagerUsers.length ===
                    0 && (

                    <p className="mt-2 text-xs text-red-600">
                      No active resident/admin
                      is available. Choose
                      "New Manager".
                    </p>

                  )}

                </div>

              )}

              {/* NEW MANAGER */}

              {managerMode ===
                'new' && (

                <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <FormField
                      label="Manager Name"
                      required
                      value={
                        managerForm.name
                      }
                      onChange={
                        value =>
                          handleManagerInput(
                            'name',
                            value
                          )
                      }
                      placeholder="Manager Name"
                    />

                    <FormField
                      label="Email"
                      required
                      type="email"
                      value={
                        managerForm.email
                      }
                      onChange={
                        value =>
                          handleManagerInput(
                            'email',
                            value
                          )
                      }
                      placeholder="manager@example.com"
                    />

                    <FormField
                      label="Phone"
                      required
                      value={
                        managerForm.phone
                      }
                      onChange={
                        value =>
                          handleManagerInput(
                            'phone',
                            value
                              .replace(
                                /\D/g,
                                ''
                              )
                              .slice(
                                0,
                                10
                              )
                          )
                      }
                      placeholder="9876543210"
                      maxLength={10}
                    />

                    <FormField
                      label="Flat / Office"
                      required
                      value={
                        managerForm.flat_no
                      }
                      onChange={
                        value =>
                          handleManagerInput(
                            'flat_no',
                            value
                          )
                      }
                      placeholder="A-101"
                    />

                    <div className="md:col-span-2">

                      <FormField
                        label="Password"
                        required
                        type="password"
                        value={
                          managerForm.password
                        }
                        onChange={
                          value =>
                            handleManagerInput(
                              'password',
                              value
                            )
                        }
                        placeholder="Minimum 8 characters"
                      />

                    </div>

                  </div>

                </div>

              )}

              {/* BUTTONS */}

              <div className="flex justify-end gap-2 pt-2">

                <button
                  type="button"
                  onClick={
                    closeManagerForm
                  }
                  disabled={
                    savingManager
                  }
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    savingManager ||
                    (
                      managerMode ===
                      'existing' &&
                      availableManagerUsers.length ===
                        0
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
                >

                  {savingManager && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}

                  {savingManager
                    ? 'Saving...'
                    : manager
                      ? 'Change Manager'
                      : 'Assign Manager'}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {

  return (
    <div className="flex items-start gap-3">

      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-xs text-slate-500">
          {label}
        </p>

        <p className="mt-0.5 text-sm font-semibold text-slate-800 break-words">
          {value}
        </p>

      </div>

    </div>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  label,
  value,
  icon
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
          {icon}
        </div>

        <div>

          <p className="text-xs text-slate-500">
            {label}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// FORM FIELD
// ============================================================

function FormField({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {

  return (
    <label className="block">

      <span className="mb-1.5 block text-sm font-medium text-slate-700">

        {label}

        {required && (
          <span className="text-red-500">
            {' '}*
          </span>
        )}

      </span>

      <input
        type={type}
        value={value}
        onChange={
          event =>
            onChange(
              event.target.value
            )
        }
        placeholder={
          placeholder
        }
        maxLength={
          maxLength
        }
        required={
          required
        }
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
      />

    </label>
  );
}