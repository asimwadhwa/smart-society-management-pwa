'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Plus,
  ClipboardList,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export default function ComplaintsPage() {
  const { toast } = useToast();

  const {
    getMyComplaints,
    loading,
  } = useComplaints();

  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [detailDialogOpen, setDetailDialogOpen] =
    useState(false);

  const [dataLoading, setDataLoading] =
    useState(true);

  // Fetch complaints
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

      const response = await getMyComplaints(
        page,
        10,
        status
      );

      setComplaints(response.data);

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

  // Open complaint details
  const openDetailDialog = (
    complaint: Complaint
  ) => {
    setSelectedComplaint(complaint);
    setDetailDialogOpen(true);
  };

  // Format date
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

  // Status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            Open
          </Badge>
        );

      case 'in-progress':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            In Progress
          </Badge>
        );

      case 'resolved':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
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

  // Status statistics
  const getStatusStats = () => {
    const stats = {
      open: 0,
      'in-progress': 0,
      resolved: 0,
    };

    complaints.forEach((complaint) => {
      if (complaint.status in stats) {
        stats[
          complaint.status as keyof typeof stats
        ]++;
      }
    });

    return stats;
  };

  const stats = getStatusStats();

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">

      {/* ================= HEADER ================= */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div className="min-w-0">
          <h1 className="text-3xl font-bold text-gray-900 break-words">
            My Complaints
          </h1>

          <p className="text-gray-600 mt-1">
            View and track your complaints
          </p>
        </div>

        <Link
          href="/complaints/new"
          className="w-full sm:w-auto"
        >
          <Button className="w-full sm:w-auto gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <Plus className="w-4 h-4" />
            New Complaint
          </Button>
        </Link>

      </div>


      {/* ================= STATS CARDS ================= */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Open */}

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">

            <div className="flex items-center gap-4">

              <div className="p-3 bg-amber-100 rounded-xl shrink-0">
                <ClipboardList className="w-6 h-6 text-amber-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Open
                </p>

                <p className="text-2xl font-bold text-amber-600">
                  {stats.open}
                </p>
              </div>

            </div>

          </CardContent>
        </Card>


        {/* In Progress */}

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">

            <div className="flex items-center gap-4">

              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <RefreshCw className="w-6 h-6 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  In Progress
                </p>

                <p className="text-2xl font-bold text-blue-600">
                  {stats['in-progress']}
                </p>
              </div>

            </div>

          </CardContent>
        </Card>


        {/* Resolved */}

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">

            <div className="flex items-center gap-4">

              <div className="p-3 bg-green-100 rounded-xl shrink-0">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Resolved
                </p>

                <p className="text-2xl font-bold text-green-600">
                  {stats.resolved}
                </p>
              </div>

            </div>

          </CardContent>
        </Card>

      </div>


      {/* ================= COMPLAINT HISTORY ================= */}

      <Card className="w-full max-w-full overflow-hidden">

        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 space-y-0 pb-4">

          <CardTitle>
            Complaint History
          </CardTitle>

          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>

            <SelectContent>

              <SelectItem value="all">
                All Status
              </SelectItem>

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

        </CardHeader>


        <CardContent className="w-full">

          {/* ================= LOADING ================= */}

          {dataLoading ? (

            <div className="space-y-4">

              {[1, 2, 3].map((i) => (

                <div
                  key={i}
                  className="animate-pulse flex items-center gap-4 p-4 border rounded-lg"
                >

                  <div className="h-12 w-12 bg-gray-200 rounded shrink-0"></div>

                  <div className="flex-1 space-y-2">

                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>

                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>

                  </div>

                </div>

              ))}

            </div>


          ) : complaints.length === 0 ? (

            /* ================= EMPTY ================= */

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
                  : "You haven't filed any complaints yet."}
              </p>

              <Link href="/complaints/new">

                <Button className="mt-4">
                  File a Complaint
                </Button>

              </Link>

            </div>


          ) : (

            <>

              {/* ================================================= */}
              {/* DESKTOP TABLE */}
              {/* ================================================= */}

              <div className="hidden md:block w-full overflow-hidden">

                <Table className="w-full table-fixed">

                  <TableHeader>

                    <TableRow>

                      <TableHead className="w-[40%]">
                        Description
                      </TableHead>

                      <TableHead className="w-[18%]">
                        Status
                      </TableHead>

                      <TableHead className="w-[22%]">
                        Date
                      </TableHead>

                      <TableHead className="w-[20%]">
                        Actions
                      </TableHead>

                    </TableRow>

                  </TableHeader>


                  <TableBody>

                    {complaints.map((complaint) => (

                      <TableRow
                        key={complaint._id}
                      >

                        {/* Description */}

                        <TableCell className="break-words">

                          <div className="flex items-center gap-3 min-w-0">

                            {complaint.image_url && (

                              <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">

                                <Image
                                  src={complaint.image_url}
                                  alt="Complaint"
                                  fill
                                  className="object-cover"
                                />

                              </div>

                            )}

                            <p className="break-words whitespace-normal">
                              {complaint.description}
                            </p>

                          </div>

                        </TableCell>


                        {/* Status */}

                        <TableCell>
                          {getStatusBadge(
                            complaint.status
                          )}
                        </TableCell>


                        {/* Date */}

                        <TableCell className="text-sm text-gray-500 break-words whitespace-normal">

                          {formatDate(
                            complaint.created_at
                          )}

                        </TableCell>


                        {/* Action */}

                        <TableCell>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openDetailDialog(
                                complaint
                              )
                            }
                          >
                            View Details
                          </Button>

                        </TableCell>

                      </TableRow>

                    ))}

                  </TableBody>

                </Table>

              </div>


              {/* ================================================= */}
              {/* MOBILE CARDS */}
              {/* ================================================= */}

              <div className="md:hidden w-full space-y-4">

                {complaints.map((complaint) => (

                  <div
                    key={complaint._id}
                    className="w-full border rounded-xl p-4 bg-white shadow-sm overflow-hidden"
                  >

                    {/* Description */}

                    <div className="mb-4">

                      <p className="text-xs font-medium text-gray-500 mb-2">
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


                        <p className="text-sm text-gray-900 break-words whitespace-normal flex-1 min-w-0">
                          {complaint.description}
                        </p>

                      </div>

                    </div>


                    {/* Status */}

                    <div className="mb-4">

                      <p className="text-xs font-medium text-gray-500 mb-2">
                        Status
                      </p>

                      {getStatusBadge(
                        complaint.status
                      )}

                    </div>


                    {/* Date */}

                    <div className="mb-4">

                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Date
                      </p>

                      <p className="text-sm text-gray-700 break-words whitespace-normal">
                        {formatDate(
                          complaint.created_at
                        )}
                      </p>

                    </div>


                    {/* View Details */}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        openDetailDialog(
                          complaint
                        )
                      }
                    >
                      View Details
                    </Button>

                  </div>

                ))}

              </div>


              {/* ================= PAGINATION ================= */}

              {pagination.pages > 1 && (

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">

                  <p className="text-sm text-gray-500">

                    Showing{' '}
                    {(pagination.current - 1) * 10 + 1}
                    {' '}to{' '}
                    {Math.min(
                      pagination.current * 10,
                      pagination.total
                    )}
                    {' '}of{' '}
                    {pagination.total}

                  </p>


                  <div className="flex gap-2">

                    <Button
                      variant="outline"
                      size="sm"
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


      {/* ================================================= */}
      {/* DETAIL DIALOG */}
      {/* ================================================= */}

      <Dialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      >

        <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle>
              Complaint Details
            </DialogTitle>

            <DialogDescription>

              Submitted on{' '}

              {selectedComplaint &&
                formatDate(
                  selectedComplaint.created_at
                )}

            </DialogDescription>

          </DialogHeader>


          {selectedComplaint && (

            <div className="space-y-4">

              {/* Status */}

              <div className="flex flex-wrap items-center gap-2">

                <span className="text-gray-500">
                  Status:
                </span>

                {getStatusBadge(
                  selectedComplaint.status
                )}

              </div>


              {/* Image */}

              {selectedComplaint.image_url && (

                <div className="relative w-full h-64 rounded-lg overflow-hidden border">

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

              <div>

                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Description
                </h4>

                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg break-words whitespace-pre-wrap">
                  {selectedComplaint.description}
                </p>

              </div>


              {/* Admin Notes */}

              {selectedComplaint.admin_notes && (

                <div>

                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Admin Notes
                  </h4>

                  <p className="text-gray-900 bg-blue-50 p-3 rounded-lg border border-blue-100 break-words whitespace-pre-wrap">
                    {selectedComplaint.admin_notes}
                  </p>

                </div>

              )}


              {/* Resolved By */}

              {selectedComplaint.resolved_by && (

                <div>

                  <h4 className="text-sm font-medium text-gray-500 mb-1">
                    Resolved By
                  </h4>

                  <p className="text-gray-900 break-words">
                    {selectedComplaint.resolved_by.name}
                    {' '}
                    (
                    {selectedComplaint.resolved_by.email}
                    )
                  </p>

                </div>

              )}


              {/* Last Updated */}

              <div className="text-sm text-gray-500">

                Last updated:{' '}

                {formatDate(
                  selectedComplaint.updated_at
                )}

              </div>

            </div>

          )}

        </DialogContent>

      </Dialog>

    </div>
  );
}