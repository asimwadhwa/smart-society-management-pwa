'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  User,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle,
  Trash2,
  Edit,
  RefreshCw,
  X,
  Eye,
  Copy,
  Key,
} from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  flat_no: string;
  role: 'manager' | 'admin' | 'resident' | 'watchman';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface Pagination {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [watchmanDialogOpen, setWatchmanDialogOpen] = useState(false);
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);

  const [newRole, setNewRole] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const [watchmanForm, setWatchmanForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [createdWatchman, setCreatedWatchman] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);

  const isManager = user?.role === 'manager';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (roleFilter !== 'all') {
        params.append('role', roleFilter);
      }

      if (statusFilter !== 'all') {
        params.append(
          'is_active',
          statusFilter === 'active' ? 'true' : 'false'
        );
      }

      const response = await api.get(`/users?${params.toString()}`);

      setUsers(response.data.data);
      setPagination(response.data.pagination);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const getRoleInfo = (role: string) => {
    switch (role) {
      case 'manager':
        return {
          label: 'Manager',
          icon: Crown,
          color: 'bg-amber-100 text-amber-700 border-amber-200',
        };

      case 'admin':
        return {
          label: 'Admin',
          icon: Shield,
          color: 'bg-purple-100 text-purple-700 border-purple-200',
        };

      case 'watchman':
        return {
          label: 'Watchman',
          icon: Shield,
          color: 'bg-green-100 text-green-700 border-green-200',
        };

      default:
        return {
          label: 'Resident',
          icon: User,
          color: 'bg-blue-100 text-blue-700 border-blue-200',
        };
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.flat_no?.toLowerCase().includes(query) ||
      u.phone?.includes(query)
    );
  });

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      setActionLoading(true);

      await api.put(`/users/${selectedUser._id}/role`, {
        role: newRole,
      });

      toast({
        title: 'Role Updated',
        description: `${selectedUser.name}'s role has been updated to ${newRole}`,
      });

      setRoleDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');

      fetchUsers();
    } catch (err) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateUser = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);

      await api.delete(`/users/${selectedUser._id}`);

      toast({
        title: 'User Deactivated',
        description: `${selectedUser.name}'s account has been deactivated`,
      });

      setDeleteDialogOpen(false);
      setSelectedUser(null);

      fetchUsers();
    } catch (err) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Failed to deactivate user',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateWatchman = async () => {
    if (
      !watchmanForm.name.trim() ||
      !watchmanForm.email.trim() ||
      !watchmanForm.phone.trim()
    ) {
      toast({
        title: 'Error',
        description: 'Please fill all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setActionLoading(true);

      const response = await api.post(
        '/users/watchman',
        watchmanForm
      );

      setCreatedWatchman({
        name: response.data.data.user.name,
        email: response.data.data.user.email,
        password: response.data.data.tempPassword,
      });

      setWatchmanDialogOpen(false);

      setWatchmanForm({
        name: '',
        email: '',
        phone: '',
      });

      setCredentialsDialogOpen(true);

      fetchUsers();
    } catch (err) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      toast({
        title: 'Error',
        description:
          error.response?.data?.message ||
          'Failed to create watchman',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U'
    );
  };

  const renderActions = (u: UserData) => {
    return (
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => {
            setSelectedUser(u);
            setViewDialogOpen(true);
          }}
        >
          <Eye className="w-4 h-4" />
        </Button>

        {isManager && u.role !== 'manager' && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => {
                setSelectedUser(u);
                setNewRole(u.role);
                setRoleDialogOpen(true);
              }}
            >
              <Edit className="w-4 h-4" />
            </Button>

            {u.is_active && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  setSelectedUser(u);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-5 sm:space-y-6">

      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 flex-shrink-0" />

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 truncate">
              Manage Users
            </h1>
          </div>

          <p className="text-sm sm:text-base text-slate-500 mt-1">
            View and manage society members
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={fetchUsers}
            disabled={loading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-1 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </Button>

          {isManager && (
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setWatchmanDialogOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1" />

              <span className="hidden xs:inline sm:inline">
                Add Watchman
              </span>

              <span className="xs:hidden">
                Watchman
              </span>
            </Button>
          )}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">

        <Card className="border-0 shadow-sm min-w-0">
          <CardContent className="p-4 sm:pt-5 sm:pb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {pagination?.total || 0}
                </p>

                <p className="text-xs text-slate-500 truncate">
                  Total Users
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm min-w-0">
          <CardContent className="p-4 sm:pt-5 sm:pb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {users.filter(
                    (u) => u.role === 'admin'
                  ).length}
                </p>

                <p className="text-xs text-slate-500">
                  Admins
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm min-w-0">
          <CardContent className="p-4 sm:pt-5 sm:pb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {users.filter(
                    (u) => u.is_active
                  ).length}
                </p>

                <p className="text-xs text-slate-500">
                  Active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm min-w-0">
          <CardContent className="p-4 sm:pt-5 sm:pb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-amber-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-slate-900">
                  {users.filter(
                    (u) => u.role === 'resident'
                  ).length}
                </p>

                <p className="text-xs text-slate-500">
                  Residents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* FILTERS */}
      <Card className="border-0 shadow-sm min-w-0">
        <CardContent className="p-4 sm:pt-5">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 min-w-0">

            <div className="flex-1 relative min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

              <Input
                placeholder="Search by name, email, flat, or phone..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-9 w-full min-w-0"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2 w-full lg:w-auto">

              <Select
                value={roleFilter}
                onValueChange={setRoleFilter}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="w-4 h-4 mr-1 flex-shrink-0" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="resident">Resident</SelectItem>
                  <SelectItem value="watchman">Watchman</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </div>
        </CardContent>
      </Card>

      {/* USERS */}
      <Card className="border-0 shadow-sm overflow-hidden min-w-0">
        <CardContent className="p-0 min-w-0">

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-500">
              <Users className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-center">No users found</p>
            </div>
          ) : (
            <>

              {/* MOBILE + TABLET CARDS */}
              <div className="lg:hidden p-3 sm:p-4 space-y-3 min-w-0">

                {filteredUsers.map((u) => {
                  const roleInfo = getRoleInfo(u.role);
                  const RoleIcon = roleInfo.icon;

                  return (
                    <div
                      key={u._id}
                      className="w-full min-w-0 rounded-xl border bg-white p-4 shadow-sm overflow-hidden"
                    >

                      {/* User Header */}
                      <div className="flex min-w-0 items-start justify-between gap-3">

                        <div className="flex items-center gap-3 min-w-0 flex-1">

                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {getInitials(u.name)}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-slate-900 truncate">
                              {u.name}
                            </p>

                            <p className="text-xs text-slate-500 break-all line-clamp-2">
                              {u.email}
                            </p>
                          </div>

                        </div>

                        {u.is_active ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 flex-shrink-0 whitespace-nowrap"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 flex-shrink-0 whitespace-nowrap"
                          >
                            <X className="w-3 h-3 mr-1" />
                            Inactive
                          </Badge>
                        )}

                      </div>

                      {/* User Details */}
                      <div className="mt-4 grid grid-cols-1 gap-2 text-sm">

                        <div className="flex items-center gap-2 text-slate-600 min-w-0">
                          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />

                          <span className="break-all">
                            {u.phone || 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-600 min-w-0">
                          <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />

                          <span className="break-words">
                            {u.flat_no
                              ? `Flat ${u.flat_no}`
                              : 'No Flat Assigned'}
                          </span>
                        </div>

                        <div>
                          <Badge
                            variant="outline"
                            className={`${roleInfo.color} whitespace-nowrap`}
                          >
                            <RoleIcon className="w-3 h-3 mr-1" />
                            {roleInfo.label}
                          </Badge>
                        </div>

                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 min-w-0">

                        <span className="text-xs text-slate-400 truncate">
                          Member since{' '}
                          {new Date(
                            u.created_at
                          ).toLocaleDateString('en-IN', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>

                        {renderActions(u)}

                      </div>

                    </div>
                  );
                })}

              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden lg:block overflow-x-auto">

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Flat</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>

                    {filteredUsers.map((u) => {
                      const roleInfo = getRoleInfo(u.role);
                      const RoleIcon = roleInfo.icon;

                      return (
                        <TableRow key={u._id}>

                          <TableCell>
                            <div className="flex items-center gap-3">

                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-sm">
                                  {getInitials(u.name)}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <p className="font-medium text-slate-900">
                                  {u.name}
                                </p>

                                <p className="text-xs text-slate-500 truncate max-w-[220px]">
                                  {u.email}
                                </p>
                              </div>

                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                              {u.phone || 'N/A'}
                            </div>
                          </TableCell>

                          <TableCell>
                            {u.flat_no ? (
                              <Badge
                                variant="outline"
                                className="bg-slate-50"
                              >
                                <MapPin className="w-3 h-3 mr-1" />
                                {u.flat_no}
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-sm">
                                N/A
                              </span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge
                              variant="outline"
                              className={roleInfo.color}
                            >
                              <RoleIcon className="w-3 h-3 mr-1" />
                              {roleInfo.label}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {u.is_active ? (
                              <Badge
                                variant="outline"
                                className="bg-green-50 text-green-700 border-green-200"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-red-50 text-red-700 border-red-200"
                              >
                                <X className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="flex justify-end">
                              {renderActions(u)}
                            </div>
                          </TableCell>

                        </TableRow>
                      );
                    })}

                  </TableBody>
                </Table>

              </div>

            </>
          )}

        </CardContent>
      </Card>

      {/* VIEW USER DIALOG */}
      <Dialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[90vh] overflow-y-auto rounded-xl">

          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-5">

              <div className="flex items-center gap-4 min-w-0">

                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg sm:text-xl">
                    {getInitials(selectedUser.name)}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {selectedUser.name}
                  </h3>

                  <Badge
                    variant="outline"
                    className={
                      getRoleInfo(selectedUser.role).color
                    }
                  >
                    {getRoleInfo(selectedUser.role).label}
                  </Badge>
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">

                <div className="min-w-0">
                  <p className="text-xs text-slate-500">
                    Email
                  </p>

                  <p className="text-sm font-medium flex items-start gap-1 break-all">
                    <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    {selectedUser.email}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Phone
                  </p>

                  <p className="text-sm font-medium flex items-center gap-1 break-all">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    {selectedUser.phone || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Flat No
                  </p>

                  <p className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {selectedUser.flat_no || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Status
                  </p>

                  {selectedUser.is_active ? (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-red-50 text-red-700"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-500">
                    Member Since
                  </p>

                  <p className="text-sm font-medium">
                    {new Date(
                      selectedUser.created_at
                    ).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

              </div>

            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* UPDATE ROLE DIALOG */}
      <Dialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl">

          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>

            <DialogDescription>
              Change the role for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>Select Role</Label>

            <Select
              value={newRole}
              onValueChange={setNewRole}
            >
              <SelectTrigger className="mt-2 w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="resident">Resident</SelectItem>
                <SelectItem value="watchman">Watchman</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setRoleDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              className="w-full sm:w-auto"
              onClick={handleUpdateRole}
              disabled={actionLoading}
            >
              {actionLoading
                ? 'Updating...'
                : 'Update Role'}
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* DEACTIVATE USER DIALOG */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl">

          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              Deactivate User
            </DialogTitle>

            <DialogDescription>
              Are you sure you want to deactivate{' '}
              {selectedUser?.name}? This will prevent them
              from accessing the system.
            </DialogDescription>
          </DialogHeader>

          <Alert className="bg-red-50 border-red-200">

            <AlertCircle className="h-4 w-4 text-red-600" />

            <AlertTitle className="text-red-800">
              Warning
            </AlertTitle>

            <AlertDescription className="text-red-700">
              This action can be reversed by a manager later.
            </AlertDescription>

          </Alert>

          <DialogFooter className="flex-col sm:flex-row gap-2">

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleDeactivateUser}
              disabled={actionLoading}
            >
              {actionLoading
                ? 'Deactivating...'
                : 'Deactivate User'}
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* CREATE WATCHMAN DIALOG */}
      <Dialog
        open={watchmanDialogOpen}
        onOpenChange={setWatchmanDialogOpen}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-xl">

          <DialogHeader>
            <DialogTitle>
              Create Watchman Account
            </DialogTitle>

            <DialogDescription>
              Add a new watchman to the society. A temporary
              password will be generated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">

            <div>
              <Label>Name</Label>

              <Input
                placeholder="Enter watchman name"
                value={watchmanForm.name}
                onChange={(e) =>
                  setWatchmanForm({
                    ...watchmanForm,
                    name: e.target.value,
                  })
                }
                className="mt-1 w-full"
              />
            </div>

            <div>
              <Label>Email</Label>

              <Input
                type="email"
                placeholder="Enter email address"
                value={watchmanForm.email}
                onChange={(e) =>
                  setWatchmanForm({
                    ...watchmanForm,
                    email: e.target.value,
                  })
                }
                className="mt-1 w-full"
              />
            </div>

            <div>
              <Label>Phone</Label>

              <Input
                type="tel"
                placeholder="Enter phone number"
                value={watchmanForm.phone}
                onChange={(e) =>
                  setWatchmanForm({
                    ...watchmanForm,
                    phone: e.target.value,
                  })
                }
                className="mt-1 w-full"
              />
            </div>

          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setWatchmanDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button
              className="w-full sm:w-auto"
              onClick={handleCreateWatchman}
              disabled={actionLoading}
            >
              {actionLoading
                ? 'Creating...'
                : 'Create Watchman'}
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

      {/* WATCHMAN CREDENTIALS */}
      <Dialog
        open={credentialsDialogOpen}
        onOpenChange={setCredentialsDialogOpen}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto rounded-xl">

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              Watchman Account Created
            </DialogTitle>

            <DialogDescription>
              Please save these credentials. The password
              cannot be retrieved later.
            </DialogDescription>
          </DialogHeader>

          {createdWatchman && (
            <div className="space-y-4 py-4">

              <Alert className="bg-amber-50 border-amber-200">

                <Key className="h-4 w-4 text-amber-600" />

                <AlertTitle className="text-amber-800">
                  Important
                </AlertTitle>

                <AlertDescription className="text-amber-700">
                  Share these credentials with the watchman.
                  They should change the password after first
                  login.
                </AlertDescription>

              </Alert>

              <div className="space-y-4 p-4 bg-slate-50 rounded-lg">

                <div>
                  <Label className="text-xs text-slate-500">
                    Name
                  </Label>

                  <p className="font-medium text-slate-900 break-words">
                    {createdWatchman.name}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-slate-500">
                    Email
                  </Label>

                  <div className="flex items-center gap-2 mt-1 min-w-0">

                    <p className="font-medium text-slate-900 flex-1 min-w-0 break-all">
                      {createdWatchman.email}
                    </p>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          createdWatchman.email
                        );

                        toast({
                          title: 'Copied!',
                          description:
                            'Email copied to clipboard',
                        });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-500">
                    Temporary Password
                  </Label>

                  <div className="flex items-center gap-2 mt-1 min-w-0">

                    <code className="flex-1 min-w-0 px-3 py-2 bg-white border rounded font-mono text-sm sm:text-lg font-bold text-blue-600 break-all">
                      {createdWatchman.password}
                    </code>

                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          createdWatchman.password
                        );

                        toast({
                          title: 'Copied!',
                          description:
                            'Password copied to clipboard',
                        });
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>

                  </div>
                </div>

              </div>

            </div>
          )}

          <DialogFooter>

            <Button
              className="w-full"
              onClick={() => {
                setCredentialsDialogOpen(false);
                setCreatedWatchman(null);
              }}
            >
              I've Saved the Credentials
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}