'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import {
  Building2,
  Users,
  UserCog,
  Crown,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  Eye,
  X,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
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

interface SocietyWithData extends Society {
  stats?: SocietyStats;
  manager?: Manager | null;
}

interface SocietyForm {
  name: string;
  society_code: string;
  address: string;
  city: string;
  state: string;
  contact_number: string;
}

interface ManagerForm {
  name: string;
  email: string;
  password: string;
  phone: string;
  flat_no: string;
}

const emptySocietyForm: SocietyForm = {
  name: '',
  society_code: '',
  address: '',
  city: '',
  state: '',
  contact_number: '',
};

const emptyManagerForm: ManagerForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  flat_no: '',
};

export default function SocietiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [societies, setSocieties] = useState<SocietyWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [showSocietyForm, setShowSocietyForm] = useState(false);
  const [editingSociety, setEditingSociety] = useState<Society | null>(null);
  const [societyForm, setSocietyForm] = useState<SocietyForm>(emptySocietyForm);
  const [savingSociety, setSavingSociety] = useState(false);

  const [showManagerForm, setShowManagerForm] = useState(false);
  const [managerSociety, setManagerSociety] = useState<SocietyWithData | null>(null);
  const [managerForm, setManagerForm] = useState<ManagerForm>(emptyManagerForm);
  const [savingManager, setSavingManager] = useState(false);

  const [selectedSociety, setSelectedSociety] = useState<SocietyWithData | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchSocieties = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get('/societies');

      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Failed to load societies');
      }

      const list: Society[] = response.data.data || [];

      const enriched = await Promise.all(
        list.map(async (society) => {
          let stats: SocietyStats | undefined;
          let manager: Manager | null | undefined;

          try {
            const statsResponse = await api.get(
              `/societies/${society._id}/stats`
            );

            if (statsResponse.data?.success) {
              stats = statsResponse.data.data;
            }
          } catch (error) {
            console.error(
              `Failed to load stats for ${society.name}:`,
              error
            );
          }

          try {
            const managerResponse = await api.get(
              `/societies/${society._id}/manager`
            );

            if (managerResponse.data?.success) {
              manager = managerResponse.data.data || null;
            }
          } catch (error) {
            manager = null;
          }

          return {
            ...society,
            stats,
            manager,
          };
        })
      );

      setSocieties(enriched);

      if (showRefresh) {
        toast({
          title: 'Societies refreshed',
          description: 'Latest society data has been loaded.',
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch societies:', error);

      toast({
        title: 'Unable to load societies',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isSuperAdmin) {
      router.replace('/');
      return;
    }

    fetchSocieties();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  const filteredSocieties = useMemo(() => {
    const query = search.trim().toLowerCase();

    return societies.filter((society) => {
      const matchesSearch =
        !query ||
        society.name.toLowerCase().includes(query) ||
        society.society_code.toLowerCase().includes(query) ||
        society.city.toLowerCase().includes(query) ||
        society.state.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && society.is_active) ||
        (statusFilter === 'inactive' && !society.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [societies, search, statusFilter]);

  const totalSocieties = societies.length;
  const activeSocieties = societies.filter((s) => s.is_active).length;
  const inactiveSocieties = societies.filter((s) => !s.is_active).length;

  const totalUsers = societies.reduce(
    (sum, society) => sum + (society.stats?.totalUsers || 0),
    0
  );

  const openCreateSociety = () => {
    setEditingSociety(null);
    setSocietyForm(emptySocietyForm);
    setShowSocietyForm(true);
  };

  const openEditSociety = (society: Society) => {
    setEditingSociety(society);

    setSocietyForm({
      name: society.name || '',
      society_code: society.society_code || '',
      address: society.address || '',
      city: society.city || '',
      state: society.state || '',
      contact_number: society.contact_number || '',
    });

    setShowSocietyForm(true);
  };

  const closeSocietyForm = () => {
    if (savingSociety) {
      return;
    }

    setShowSocietyForm(false);
    setEditingSociety(null);
    setSocietyForm(emptySocietyForm);
  };

  const handleSocietyInput = (
    field: keyof SocietyForm,
    value: string
  ) => {
    setSocietyForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveSociety = async (event: React.FormEvent) => {
    event.preventDefault();

    const payload = {
      name: societyForm.name.trim(),
      society_code: societyForm.society_code.trim().toUpperCase(),
      address: societyForm.address.trim(),
      city: societyForm.city.trim(),
      state: societyForm.state.trim(),
      contact_number: societyForm.contact_number.trim(),
    };

    if (
      !payload.name ||
      !payload.society_code ||
      !payload.address ||
      !payload.city ||
      !payload.state ||
      !payload.contact_number
    ) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill all society details.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(payload.contact_number)) {
      toast({
        title: 'Invalid contact number',
        description: 'Enter a valid 10-digit Indian mobile number.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingSociety(true);

      let response;

      if (editingSociety) {
        response = await api.put(
          `/societies/${editingSociety._id}`,
          payload
        );
      } else {
        response = await api.post('/societies', payload);
      }

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            'Failed to save society'
        );
      }

      toast({
        title: editingSociety
          ? 'Society updated'
          : 'Society created',
        description: editingSociety
          ? `${payload.name} has been updated successfully.`
          : `${payload.name} has been created successfully.`,
      });

      closeSocietyForm();
      await fetchSocieties();
    } catch (error: any) {
      console.error('Save society error:', error);

      toast({
        title: 'Society save failed',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to save society.',
        variant: 'destructive',
      });
    } finally {
      setSavingSociety(false);
    }
  };

  const toggleSocietyStatus = async (
    society: SocietyWithData
  ) => {
    const action = society.is_active
      ? 'deactivate'
      : 'activate';

    const confirmed = window.confirm(
      society.is_active
        ? `Deactivate ${society.name}? Users of this society will not be able to login while the society is inactive.`
        : `Activate ${society.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = society.is_active
        ? await api.delete(`/societies/${society._id}`)
        : await api.put(`/societies/${society._id}/activate`);

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            `Failed to ${action} society`
        );
      }

      toast({
        title:
          action === 'activate'
            ? 'Society activated'
            : 'Society deactivated',
        description: `${society.name} is now ${
          action === 'activate'
            ? 'active'
            : 'inactive'
        }.`,
      });

      await fetchSocieties();
    } catch (error: any) {
      console.error(
        `Failed to ${action} society:`,
        error
      );

      toast({
        title: 'Status update failed',
        description:
          error?.response?.data?.message ||
          error?.message ||
          `Unable to ${action} society.`,
        variant: 'destructive',
      });
    }
  };

  const openSocietyDetails = async (
    society: SocietyWithData
  ) => {
    setSelectedSociety(society);
    setLoadingDetails(true);

    try {
      const [statsResponse, managerResponse] =
        await Promise.all([
          api.get(`/societies/${society._id}/stats`),
          api
            .get(`/societies/${society._id}/manager`)
            .catch(() => null),
        ]);

      const updated: SocietyWithData = {
        ...society,
        stats: statsResponse.data?.success
          ? statsResponse.data.data
          : society.stats,
        manager:
          managerResponse?.data?.success
            ? managerResponse.data.data || null
            : society.manager || null,
      };

      setSelectedSociety(updated);
    } catch (error) {
      console.error(
        'Failed to load society details:',
        error
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedSociety(null);
  };

  const openManagerForm = (
    society: SocietyWithData
  ) => {
    if (society.manager) {
      toast({
        title: 'Manager already exists',
        description:
          'This society already has a manager. Edit manager from Manage Users after the manager is created.',
        variant: 'destructive',
      });
      return;
    }

    setManagerSociety(society);
    setManagerForm(emptyManagerForm);
    setShowManagerForm(true);
  };

  const closeManagerForm = () => {
    if (savingManager) {
      return;
    }

    setShowManagerForm(false);
    setManagerSociety(null);
    setManagerForm(emptyManagerForm);
  };

  const handleManagerInput = (
    field: keyof ManagerForm,
    value: string
  ) => {
    setManagerForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const createManager = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!managerSociety) {
      return;
    }

    const payload = {
      society_id: managerSociety._id,
      name: managerForm.name.trim(),
      email: managerForm.email.trim().toLowerCase(),
      password: managerForm.password,
      phone: managerForm.phone.trim(),
      flat_no: managerForm.flat_no.trim(),
    };

    if (
      !payload.name ||
      !payload.email ||
      !payload.password ||
      !payload.phone ||
      !payload.flat_no
    ) {
      toast({
        title: 'Required fields missing',
        description: 'Please fill all manager details.',
        variant: 'destructive',
      });
      return;
    }

    if (!/^[6-9]\d{9}$/.test(payload.phone)) {
      toast({
        title: 'Invalid phone number',
        description: 'Enter a valid 10-digit Indian mobile number.',
        variant: 'destructive',
      });
      return;
    }

    if (payload.password.length < 6) {
      toast({
        title: 'Invalid password',
        description: 'Manager password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSavingManager(true);

      const response = await api.post(
        '/auth/manager-setup',
        payload
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            'Failed to create manager'
        );
      }

      toast({
        title: 'Manager created',
        description: `${payload.name} is now the manager of ${managerSociety.name}.`,
      });

      closeManagerForm();
      await fetchSocieties();
    } catch (error: any) {
      console.error(
        'Create manager error:',
        error
      );

      toast({
        title: 'Manager creation failed',
        description:
          error?.response?.data?.message ||
          error?.message ||
          'Unable to create manager.',
        variant: 'destructive',
      });
    } finally {
      setSavingManager(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">
            Loading societies...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return null;
  }

  return (
    <div className="space-y-6 pb-10">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
            <Crown className="w-6 h-6 text-white" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Manage Societies
            </h1>
            <p className="text-slate-500 mt-1">
              Create and manage all societies from one place
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fetchSocieties(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateSociety}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Society
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="rounded-xl border border-red-100 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />

          <div>
            <p className="font-semibold text-red-800">
              Super Admin Society Management
            </p>
            <p className="text-sm text-red-700 mt-1">
              Create Society A, B, C and manage their status,
              manager and user statistics. Society users will
              register later using the Society Code.
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Societies"
          value={totalSocieties}
          icon={<Building2 className="w-5 h-5" />}
          iconClass="bg-blue-100 text-blue-600"
        />

        <SummaryCard
          title="Active Societies"
          value={activeSocieties}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconClass="bg-green-100 text-green-600"
        />

        <SummaryCard
          title="Inactive Societies"
          value={inactiveSocieties}
          icon={<XCircle className="w-5 h-5" />}
          iconClass="bg-red-100 text-red-600"
        />

        <SummaryCard
          title="Total Users"
          value={totalUsers}
          icon={<Users className="w-5 h-5" />}
          iconClass="bg-purple-100 text-purple-600"
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search by society name, code, city or state..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | 'all'
                  | 'active'
                  | 'inactive'
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* SOCIETIES */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="font-bold text-slate-900">
              All Societies
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {filteredSocieties.length} of {societies.length}{' '}
              societies
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateSociety}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
          >
            <Plus className="w-4 h-4" />
            Add Society
          </button>
        </div>

        {filteredSocieties.length === 0 ? (
          <div className="py-16 text-center px-5">
            <Building2 className="w-14 h-14 mx-auto text-slate-300" />

            <h3 className="mt-4 text-lg font-semibold text-slate-700">
              {societies.length === 0
                ? 'No societies found'
                : 'No matching societies'}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {societies.length === 0
                ? 'Create your first society to get started.'
                : 'Try a different search or status filter.'}
            </p>

            {societies.length === 0 && (
              <button
                type="button"
                onClick={openCreateSociety}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create First Society
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 p-5">
            {filteredSocieties.map((society) => (
              <div
                key={society._id}
                className="rounded-xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all"
              >
                {/* TOP */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">
                        {society.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1">
                        Code: {society.society_code}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
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

                {/* DETAILS */}
                <div className="mt-5 space-y-3">
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    text={`${society.address}, ${society.city}, ${society.state}`}
                  />

                  <InfoRow
                    icon={<Phone className="w-4 h-4" />}
                    text={society.contact_number}
                  />

                  <InfoRow
                    icon={<Users className="w-4 h-4" />}
                    text={`${society.stats?.totalUsers || 0} total users`}
                  />

                  <InfoRow
                    icon={<UserCog className="w-4 h-4" />}
                    text={
                      society.manager
                        ? `Manager: ${society.manager.name || society.manager.email || 'Assigned'}`
                        : 'Manager: Not assigned'
                    }
                  />
                </div>

                {/* ROLE COUNTS */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <MiniStat
                    label="Residents"
                    value={
                      society.stats?.residents || 0
                    }
                  />

                  <MiniStat
                    label="Admins"
                    value={
                      society.stats?.admins || 0
                    }
                  />

                  <MiniStat
                    label="Managers"
                    value={
                      society.stats?.managers || 0
                    }
                  />
                </div>

                {/* ACTIONS */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openSocietyDetails(society)
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openEditSociety(society)
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openManagerForm(society)
                    }
                    disabled={
                      !society.is_active ||
                      !!society.manager
                    }
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                    {society.manager
                      ? 'Manager Added'
                      : 'Add Manager'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleSocietyStatus(society)
                    }
                    className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      society.is_active
                        ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                        : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {society.is_active
                      ? 'Deactivate'
                      : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT SOCIETY MODAL */}
      {showSocietyForm && (
        <Modal
          title={
            editingSociety
              ? 'Edit Society'
              : 'Create New Society'
          }
          onClose={closeSocietyForm}
        >
          <form
            onSubmit={saveSociety}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Society Name"
                required
                value={societyForm.name}
                onChange={(value) =>
                  handleSocietyInput(
                    'name',
                    value
                  )
                }
                placeholder="ABC Residency"
              />

              <FormField
                label="Society Code"
                required
                value={societyForm.society_code}
                onChange={(value) =>
                  handleSocietyInput(
                    'society_code',
                    value.toUpperCase()
                  )
                }
                placeholder="ABC001"
                disabled={!!editingSociety}
              />

              <FormField
                label="Address"
                required
                value={societyForm.address}
                onChange={(value) =>
                  handleSocietyInput(
                    'address',
                    value
                  )
                }
                placeholder="123 Main Road"
              />

              <FormField
                label="City"
                required
                value={societyForm.city}
                onChange={(value) =>
                  handleSocietyInput(
                    'city',
                    value
                  )
                }
                placeholder="Pune"
              />

              <FormField
                label="State"
                required
                value={societyForm.state}
                onChange={(value) =>
                  handleSocietyInput(
                    'state',
                    value
                  )
                }
                placeholder="Maharashtra"
              />

              <FormField
                label="Contact Number"
                required
                value={societyForm.contact_number}
                onChange={(value) =>
                  handleSocietyInput(
                    'contact_number',
                    value.replace(/\D/g, '').slice(0, 10)
                  )
                }
                placeholder="9876543210"
                maxLength={10}
              />
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
              <p className="text-xs text-slate-600">
                Society Code is used by residents, admins and
                managers during login/registration. Example:
                <strong> ABC001</strong>.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeSocietyForm}
                disabled={savingSociety}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingSociety}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingSociety && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                {editingSociety
                  ? 'Update Society'
                  : 'Create Society'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CREATE MANAGER MODAL */}
      {showManagerForm && managerSociety && (
        <Modal
          title={`Add Manager — ${managerSociety.name}`}
          onClose={closeManagerForm}
        >
          <form
            onSubmit={createManager}
            className="space-y-4"
          >
            <div className="rounded-lg border border-purple-100 bg-purple-50 p-3">
              <p className="text-sm font-semibold text-purple-800">
                Society Code: {managerSociety.society_code}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                This manager will be linked only to this society.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Manager Name"
                required
                value={managerForm.name}
                onChange={(value) =>
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
                value={managerForm.email}
                onChange={(value) =>
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
                value={managerForm.phone}
                onChange={(value) =>
                  handleManagerInput(
                    'phone',
                    value.replace(/\D/g, '').slice(0, 10)
                  )
                }
                placeholder="9876543210"
                maxLength={10}
              />

              <FormField
                label="Flat No"
                required
                value={managerForm.flat_no}
                onChange={(value) =>
                  handleManagerInput(
                    'flat_no',
                    value
                  )
                }
                placeholder="OFFICE / A-101"
              />

              <div className="md:col-span-2">
                <FormField
                  label="Password"
                  required
                  type="password"
                  value={managerForm.password}
                  onChange={(value) =>
                    handleManagerInput(
                      'password',
                      value
                    )
                  }
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeManagerForm}
                disabled={savingManager}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingManager}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
              >
                {savingManager && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}

                Create Manager
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DETAILS MODAL */}
      {selectedSociety && (
        <Modal
          title={selectedSociety.name}
          onClose={closeDetails}
        >
          {loadingDetails ? (
            <div className="py-10 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600" />
              <p className="mt-3 text-sm text-slate-500">
                Loading society details...
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {selectedSociety.society_code}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    selectedSociety.is_active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedSociety.is_active
                    ? 'Active'
                    : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailBox
                  label="Address"
                  value={`${selectedSociety.address}, ${selectedSociety.city}, ${selectedSociety.state}`}
                />

                <DetailBox
                  label="Contact"
                  value={selectedSociety.contact_number}
                />

                <DetailBox
                  label="Total Users"
                  value={
                    selectedSociety.stats
                      ?.totalUsers || 0
                  }
                />

                <DetailBox
                  label="Active Users"
                  value={
                    selectedSociety.stats
                      ?.activeUsers || 0
                  }
                />

                <DetailBox
                  label="Residents"
                  value={
                    selectedSociety.stats
                      ?.residents || 0
                  }
                />

                <DetailBox
                  label="Admins"
                  value={
                    selectedSociety.stats
                      ?.admins || 0
                  }
                />

                <DetailBox
                  label="Managers"
                  value={
                    selectedSociety.stats
                      ?.managers || 0
                  }
                />

                <DetailBox
                  label="Watchmen"
                  value={
                    selectedSociety.stats
                      ?.watchmen || 0
                  }
                />
              </div>

              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <UserCog className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-slate-900">
                    Society Manager
                  </h3>
                </div>

                {selectedSociety.manager ? (
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <strong>Name:</strong>{' '}
                      {selectedSociety.manager.name ||
                        'N/A'}
                    </p>

                    <p>
                      <strong>Email:</strong>{' '}
                      {selectedSociety.manager.email ||
                        'N/A'}
                    </p>

                    <p>
                      <strong>Phone:</strong>{' '}
                      {selectedSociety.manager.phone ||
                        'N/A'}
                    </p>

                    <p>
                      <strong>Flat:</strong>{' '}
                      {selectedSociety.manager.flat_no ||
                        'N/A'}
                    </p>
                  </div>
                ) : (
                  <div className="mt-3">
                    <p className="text-sm text-slate-500">
                      No manager assigned to this society.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        closeDetails();
                        openManagerForm(
                          selectedSociety
                        );
                      }}
                      disabled={
                        !selectedSociety.is_active
                      }
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      <UserCog className="w-4 h-4" />
                      Add Manager
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeDetails}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm text-slate-600">
      <span className="mt-0.5 text-slate-400 shrink-0">
        {icon}
      </span>

      <span className="break-words">
        {text}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 text-center">
      <p className="text-[11px] text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function FormField({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  maxLength,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="text-red-500"> *</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        required={required}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-800 break-words">
        {value}
      </p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
