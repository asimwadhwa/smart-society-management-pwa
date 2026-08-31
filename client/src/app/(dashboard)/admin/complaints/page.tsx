'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

import {
  useComplaints,
  Complaint,
} from '@/hooks/useComplaints';

import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  ClipboardList,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export default function AdminComplaintsPage() {
  const { toast } = useToast();

  const {
    getAllComplaints,
    updateComplaintStatus,
  } = useComplaints();

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [stats, setStats] = useState({
    open: 0,
    'in-progress': 0,
    resolved: 0,
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  const [statusFilter, setStatusFilter] =
    useState<string>('all');

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [updateDialogOpen, setUpdateDialogOpen] =
    useState(false);

  const [newStatus, setNewStatus] =
    useState<string>('');

  const [adminNotes, setAdminNotes] =
    useState('');

  const [dataLoading, setDataLoading] =
    useState(true);

  const [updateLoading, setUpdateLoading] =
    useState(false);

  useEffect(() => {
    fetchComplaints(1);
  }, [statusFilter]);

  const fetchComplaints = async (page: number) => {
    setDataLoading(true);

    try {
      const status =
        statusFilter === 'all'
          ? undefined
          : statusFilter;

      const response = await getAllComplaints(
        page,
        10,
        status
      );

      setComplaints(response.data);
      setStats(response.stats);
      setPagination(response.pagination);
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error.message ||
          'Failed to fetch complaints',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
    }
  };

  const openUpdateDialog = (
    complaint: Complaint
  ) => {
    setSelectedComplaint(complaint);
    setNewStatus(complaint.status);
    setAdminNotes(
      complaint.admin_notes || ''
    );
    setUpdateDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedComplaint) return;

    setUpdateLoading(true);

    try {
      await updateComplaintStatus(
        selectedComplaint._id,
        newStatus as
          | 'open'
          | 'in-progress'
          | 'resolved',
        adminNotes
      );

      toast({
        title: 'Status updated',
        description:
          `Complaint status changed to ${newStatus}. ` +
          'Resident has been notified.',
      });

      setUpdateDialogOpen(false);

      fetchComplaints(pagination.current);
    } catch (error: any) {
      toast({
        title: 'Update failed',
        description:
          error.message ||
          'Failed to update complaint status',
        variant: 'destructive',
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(
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

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor(
      (Date.now() -
        new Date(dateString).getTime()) /
        1000
    );

    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    return `${days}d ago`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 whitespace-nowrap">
            Open
          </Badge>
        );

      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 whitespace-nowrap">
            In Progress
          </Badge>
        );

      case 'resolved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 whitespace-nowrap">
            Resolved
          </Badge>
        );

      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-5 sm:space-y-6">

      {/* Header */}
      <div className="min-w-0">

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
          All Complaints
        </h1>

        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage complaints from all residents
        </p>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">

        {/* Total */}
        <Card
          className={`cursor-pointer transition-all min-w-0 ${
            statusFilter === 'all'
              ? 'ring-2 ring-blue-500'
              : ''
          }`}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-4 sm:pt-6">

            <div className="flex items-center gap-3 sm:gap-4 min-w-0">

              <div className="p-2.5 sm:p-3 bg-gray-100 rounded-full flex-shrink-0">
                <span className="text-xl sm:text-2xl">
                  📊
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">
                  Total
                </p>

                <p className="text-xl sm:text-2xl font-bold">
                  {stats.open +
                    stats['in-progress'] +
                    stats.resolved}
                </p>
              </div>

            </div>

          </CardContent>
        </Card>

        {/* Open */}
        <Card
          className={`cursor-pointer transition-all border-0 shadow-sm min-w-0 ${
            statusFilter === 'open'
              ? 'ring-2 ring-amber-500'
              : ''
          }`}
          onClick={() => setStatusFilter('open')}
        >
          <CardContent className="p-4 sm:pt-6">

            <div className="flex items-center gap-3 sm:gap-4 min-w-0">

              <div className="p-2.5 sm:p-3 bg-amber-100 rounded-xl flex-shrink-0">
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">
                  Open
                </p>

                <p className="text-xl sm:text-2xl font-bold text-amber-600">
                  {stats.open}
                </p>
              </div>

            </div>

          </CardContent>
        </Card>

        {/* In Progress */}
        <Card
          className={`cursor-pointer transition-all border-0 shadow-sm min-w-0 ${
            statusFilter === 'in-progress'
              ? 'ring-2 ring-blue-500'
              : ''
          }`}
          onClick={() =>
            setStatusFilter('in-progress')
          }
        >
          <CardContent className="p-4 sm:pt-6">

            <div className="flex items-center gap-3 sm:gap-4 min-w-0">

              <div className="p-2.5 sm:p-3 bg-blue-100 rounded-xl flex-shrink-0">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">
                  In Progress
                </p>

                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {stats['in-progress']}
                </p>
              </div>

            </div>

          </CardContent>
        </Card>

        {/* Resolved */}
        <Card
          className={`cursor-pointer transition-all border-0 shadow-sm min-w-0 ${
            statusFilter === 'resolved'
              ? 'ring-2 ring-green-500'
              : ''
          }`}
          onClick={() =>
            setStatusFilter('resolved')
          }
        >
          <CardContent className="p-4 sm:pt-6">

            <div className="flex items-center gap-3 sm:gap-4 min-w-0">

              <div className="p-2.5 sm:p-3 bg-green-100 rounded-xl flex-shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>

              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500">
                  Resolved
                </p>

                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {stats.resolved}
                </p>
              </div>

            </div>

          </CardContent>
        </Card>

      </div>

      {/* Complaint List */}
      <Card className="min-w-0 overflow-hidden">

        <CardHeader className="min-w-0">

          <CardTitle className="text-lg">
            Complaint List
          </CardTitle>

          <CardDescription>
            Click on a complaint to update its status
          </CardDescription>

        </CardHeader>

        <CardContent className="min-w-0">

          {dataLoading ? (
            <div className="space-y-4">

              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center gap-4 p-4 border rounded-lg"
                >
                  <div className="h-12 w-12 bg-gray-200 rounded" />

                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}

            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">

              <span className="text-5xl mb-4 block">
                📭
              </span>

              <h3 className="text-lg font-medium text-gray-900">
                No complaints found
              </h3>

              <p className="text-gray-500 mt-1">
                {statusFilter !== 'all'
                  ? 'No complaints with this status.'
                  : 'No complaints have been filed yet.'}
              </p>

            </div>
          ) : (
            <>

              {/* MOBILE + TABLET COMPLAINT CARDS */}
              <div className="space-y-3 lg:hidden min-w-0">

                {complaints.map((complaint) => (
                  <div
                    key={complaint._id}
                    className="w-full min-w-0 rounded-xl border border-gray-200 bg-white p-4 space-y-4 overflow-hidden"
                  >

                    {/* Resident */}
                    <div className="flex items-start justify-between gap-3 min-w-0">

                      <div className="min-w-0 flex-1">

                        <p className="font-semibold text-gray-900 truncate">
                          {complaint.user_id.name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1 break-all">
                          {complaint.user_id.email}
                        </p>

                        <div className="mt-2">
                          <Badge
                            variant="outline"
                            className="whitespace-nowrap"
                          >
                            Flat {complaint.flat_no}
                          </Badge>
                        </div>

                      </div>

                      <div className="flex-shrink-0">
                        {getStatusBadge(
                          complaint.status
                        )}
                      </div>

                    </div>

                    {/* Description */}
                    <div className="min-w-0">

                      <p className="text-xs text-gray-500 mb-1">
                        Description
                      </p>

                      <div className="flex items-start gap-3 min-w-0">

                        {complaint.image_url && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={complaint.image_url}
                              alt="Complaint"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        <p className="text-sm text-gray-700 break-words leading-5 min-w-0">
                          {complaint.description}
                        </p>

                      </div>

                    </div>

                    {/* Submitted */}
                    <div className="grid grid-cols-2 gap-3 text-sm">

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                          Submitted
                        </p>

                        <p className="font-medium text-gray-900 mt-1">
                          {getTimeAgo(
                            complaint.created_at
                          )}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">
                          Date
                        </p>

                        <p className="text-xs text-gray-700 mt-1 break-words">
                          {formatDate(
                            complaint.created_at
                          )}
                        </p>
                      </div>

                    </div>

                    {/* Manage */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        openUpdateDialog(
                          complaint
                        )
                      }
                    >
                      Manage Complaint
                    </Button>

                  </div>
                ))}

              </div>

              {/* DESKTOP TABLE */}
              <div className="hidden lg:block overflow-x-auto">

                <Table>
                  <TableHeader>
                    <TableRow>

                      <TableHead>
                        Resident
                      </TableHead>

                      <TableHead>
                        Flat
                      </TableHead>

                      <TableHead>
                        Description
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Submitted
                      </TableHead>

                      <TableHead>
                        Actions
                      </TableHead>

                    </TableRow>
                  </TableHeader>

                  <TableBody>

                    {complaints.map((complaint) => (
                      <TableRow
                        key={complaint._id}
                        className="cursor-pointer hover:bg-gray-50"
                      >

                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {complaint.user_id.name}
                            </p>

                            <p className="text-sm text-gray-500 break-all">
                              {complaint.user_id.email}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline">
                            {complaint.flat_no}
                          </Badge>
                        </TableCell>

                        <TableCell className="max-w-xs">
                          <div className="flex items-center gap-2">

                            {complaint.image_url && (
                              <div className="relative w-8 h-8 rounded overflow-hidden flex-shrink-0">
                                <Image
                                  src={
                                    complaint.image_url
                                  }
                                  alt="Complaint"
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}

                            <p className="truncate">
                              {complaint.description}
                            </p>

                          </div>
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(
                            complaint.status
                          )}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {getTimeAgo(
                                complaint.created_at
                              )}
                            </p>

                            <p className="text-xs text-gray-400">
                              {formatDate(
                                complaint.created_at
                              )}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openUpdateDialog(
                                complaint
                              )
                            }
                          >
                            Manage
                          </Button>
                        </TableCell>

                      </TableRow>
                    ))}

                  </TableBody>
                </Table>

              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex flex-col gap-3 mt-4 sm:flex-row sm:items-center sm:justify-between min-w-0">

                  <p className="text-sm text-gray-500">
                    Showing{' '}
                    {(pagination.current - 1) *
                      10 +
                      1}{' '}
                    to{' '}
                    {Math.min(
                      pagination.current * 10,
                      pagination.total
                    )}{' '}
                    of {pagination.total}
                  </p>

                  <div className="flex gap-2 w-full sm:w-auto">

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      disabled={
                        pagination.current === 1
                      }
                      onClick={() =>
                        fetchComplaints(
                          pagination.current - 1
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
                        fetchComplaints(
                          pagination.current + 1
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

      {/* Update Dialog */}
      <Dialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">

          <DialogHeader>
            <DialogTitle>
              Manage Complaint
            </DialogTitle>

            <DialogDescription>
              Update the status and add notes for the resident
            </DialogDescription>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-4 min-w-0">

              {/* Complaint Info */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">

                <div className="flex items-start justify-between gap-3">

                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {selectedComplaint.user_id.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      Flat {selectedComplaint.flat_no}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {getStatusBadge(
                      selectedComplaint.status
                    )}
                  </div>

                </div>

                <p className="text-sm text-gray-600 break-words">
                  Submitted:{' '}
                  {formatDate(
                    selectedComplaint.created_at
                  )}
                </p>

              </div>

              {/* Image */}
              {selectedComplaint.image_url && (
                <div className="relative w-full h-40 sm:h-48 rounded-lg overflow-hidden border">
                  <Image
                    src={
                      selectedComplaint.image_url
                    }
                    alt="Complaint image"
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              {/* Description */}
              <div className="min-w-0">

                <Label className="text-gray-500">
                  Description
                </Label>

                <p className="mt-1 text-gray-900 bg-white p-3 rounded-lg border break-words">
                  {selectedComplaint.description}
                </p>

              </div>

              {/* Status */}
              <div className="space-y-2">

                <Label htmlFor="status">
                  Update Status
                </Label>

                <Select
                  value={newStatus}
                  onValueChange={setNewStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>

                  <SelectContent>

                    <SelectItem value="open">
                      Open
                    </SelectItem>

                    <SelectItem value="in-progress">
                      In Progress
                    </SelectItem>

                    <SelectItem value="resolved">
                      Resolved
                    </SelectItem>

                  </SelectContent>
                </Select>

              </div>

              {/* Admin Notes */}
              <div className="space-y-2">

                <Label htmlFor="adminNotes">
                  Admin Notes
                </Label>

                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) =>
                    setAdminNotes(e.target.value)
                  }
                  placeholder="Add notes for the resident (they will see this in email notification)"
                  rows={3}
                  className="w-full min-w-0"
                />

              </div>

            </div>
          )}

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                setUpdateDialogOpen(false)
              }
              disabled={updateLoading}
            >
              Cancel
            </Button>

            <Button
              className="w-full sm:w-auto"
              onClick={handleStatusUpdate}
              disabled={updateLoading}
            >
              {updateLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>

          </DialogFooter>

        </DialogContent>
      </Dialog>

    </div>
  );
}