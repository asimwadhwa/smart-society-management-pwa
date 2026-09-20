'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

import api from '@/lib/api';

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


// ============================================================
// TYPES
// ============================================================

interface Society {
  _id: string;
  name: string;
  society_code: string;
  city?: string;
  state?: string;
  is_active?: boolean;
}

interface ComplaintUser {
  _id: string;
  name: string;
  email: string;
  flat_no?: string;
  phone?: string;
  role?: string;
}

interface ComplaintSociety {
  _id: string;
  name: string;
  society_code: string;
  city?: string;
  state?: string;
}

interface Complaint {
  _id: string;

  society_id:
    | string
    | ComplaintSociety;

  user_id: ComplaintUser;

  flat_no: string;

  description: string;

  image_url?: string | null;

  status:
    | 'open'
    | 'in-progress'
    | 'resolved';

  admin_notes?: string | null;

  resolved_by?: {
    _id: string;
    name: string;
    email: string;
  } | null;

  created_at: string;

  updated_at: string;
}


// ============================================================
// PAGE
// ============================================================

export default function AdminComplaintsPage() {

  const { toast } = useToast();


  // ==========================================================
  // SOCIETIES
  // ==========================================================

  const [societies, setSocieties] =
    useState<Society[]>([]);

  const [selectedSocietyId, setSelectedSocietyId] =
    useState<string>('all');


  // ==========================================================
  // COMPLAINTS
  // ==========================================================

  const [complaints, setComplaints] =
    useState<Complaint[]>([]);


  // ==========================================================
  // STATS
  // ==========================================================

  const [stats, setStats] = useState({
    open: 0,
    'in-progress': 0,
    resolved: 0,
  });


  // ==========================================================
  // PAGINATION
  // ==========================================================

  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    limit: 10,
  });


  // ==========================================================
  // FILTERS
  // ==========================================================

  const [statusFilter, setStatusFilter] =
    useState<string>('all');


  // ==========================================================
  // LOADING
  // ==========================================================

  const [dataLoading, setDataLoading] =
    useState(true);

  const [societiesLoading, setSocietiesLoading] =
    useState(true);


  // ==========================================================
  // UPDATE DIALOG
  // ==========================================================

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [updateDialogOpen, setUpdateDialogOpen] =
    useState(false);

  const [newStatus, setNewStatus] =
    useState<string>('');

  const [adminNotes, setAdminNotes] =
    useState('');

  const [updateLoading, setUpdateLoading] =
    useState(false);


  // ==========================================================
  // GET SELECTED SOCIETY NAME
  // ==========================================================

  const selectedSocietyName =
    selectedSocietyId === 'all'
      ? 'All Societies'
      : societies.find(
          society =>
            society._id === selectedSocietyId
        )?.name || 'Selected Society';


  // ==========================================================
  // FETCH SOCIETIES
  // ==========================================================

  const fetchSocieties = useCallback(
    async () => {

      setSocietiesLoading(true);

      try {

        const response =
          await api.get('/societies');

        if (
          response.data?.success
        ) {

          const societyData =
            response.data.data || [];

          setSocieties(
            Array.isArray(societyData)
              ? societyData
              : []
          );

        }

      } catch (error: any) {

        console.error(
          'Error fetching societies:',
          error
        );

        toast({
          title: 'Error',
          description:
            error?.response?.data?.message ||
            'Failed to fetch societies',
          variant: 'destructive',
        });

      } finally {

        setSocietiesLoading(false);

      }

    },
    [toast]
  );


  // ==========================================================
  // FETCH COMPLAINTS
  // ==========================================================

  const fetchComplaints = useCallback(
    async (page: number = 1) => {

      setDataLoading(true);

      try {

        const params =
          new URLSearchParams();

        params.set(
          'page',
          page.toString()
        );

        params.set(
          'limit',
          '10'
        );

        if (
          statusFilter !== 'all'
        ) {

          params.set(
            'status',
            statusFilter
          );

        }

        // ====================================================
        // IMPORTANT
        // SOCIETY FILTER
        // ====================================================

        if (
          selectedSocietyId !== 'all'
        ) {

          params.set(
            'society_id',
            selectedSocietyId
          );

        }


        const response =
          await api.get(
            `/complaints/all?${params.toString()}`
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            'Failed to fetch complaints'
          );

        }


        setComplaints(
          response.data.data || []
        );


        setStats({
          open:
            response.data.stats?.open || 0,

          'in-progress':
            response.data.stats?.[
              'in-progress'
            ] || 0,

          resolved:
            response.data.stats?.resolved || 0,
        });


        setPagination({
          current:
            response.data.pagination?.current ||
            1,

          pages:
            response.data.pagination?.pages ||
            1,

          total:
            response.data.pagination?.total ||
            0,

          limit:
            response.data.pagination?.limit ||
            10,
        });


      } catch (error: any) {

        console.error(
          'Error fetching complaints:',
          error
        );

        toast({
          title: 'Error',
          description:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to fetch complaints',
          variant: 'destructive',
        });

      } finally {

        setDataLoading(false);

      }

    },
    [
      selectedSocietyId,
      statusFilter,
      toast,
    ]
  );


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {

    fetchSocieties();

  }, [fetchSocieties]);


  // ==========================================================
  // LOAD COMPLAINTS WHEN FILTER CHANGES
  // ==========================================================

  useEffect(() => {

    fetchComplaints(1);

  }, [
    selectedSocietyId,
    statusFilter,
    fetchComplaints,
  ]);


  // ==========================================================
  // SOCIETY CHANGE
  // ==========================================================

  const handleSocietyChange = (
    value: string
  ) => {

    setSelectedSocietyId(value);

    setStatusFilter('all');

  };


  // ==========================================================
  // OPEN UPDATE DIALOG
  // ==========================================================

  const openUpdateDialog = (
    complaint: Complaint
  ) => {

    setSelectedComplaint(
      complaint
    );

    setNewStatus(
      complaint.status
    );

    setAdminNotes(
      complaint.admin_notes || ''
    );

    setUpdateDialogOpen(
      true
    );

  };


  // ==========================================================
  // UPDATE STATUS
  // ==========================================================

  const handleStatusUpdate =
    async () => {

      if (
        !selectedComplaint
      ) {
        return;
      }


      setUpdateLoading(
        true
      );


      try {

        const response =
          await api.put(
            `/complaints/${selectedComplaint._id}/status`,
            {
              status:
                newStatus,

              admin_notes:
                adminNotes,
            }
          );


        if (
          !response.data?.success
        ) {

          throw new Error(
            response.data?.message ||
            'Failed to update complaint'
          );

        }


        toast({
          title:
            'Status updated',

          description:
            `Complaint status changed to ${newStatus}. Resident has been notified.`,
        });


        setUpdateDialogOpen(
          false
        );

        setSelectedComplaint(
          null
        );


        await fetchComplaints(
          pagination.current
        );


      } catch (error: any) {

        console.error(
          'Error updating complaint:',
          error
        );

        toast({
          title:
            'Update failed',

          description:
            error?.response?.data?.message ||
            error?.message ||
            'Failed to update complaint status',

          variant:
            'destructive',
        });

      } finally {

        setUpdateLoading(
          false
        );

      }

    };


  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    dateString: string
  ) => {

    return new Date(
      dateString
    ).toLocaleString(
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
  // TIME AGO
  // ==========================================================

  const getTimeAgo = (
    dateString: string
  ) => {

    const seconds =
      Math.floor(
        (
          Date.now() -
          new Date(
            dateString
          ).getTime()
        ) / 1000
      );


    if (
      seconds < 60
    ) {
      return 'Just now';
    }


    const minutes =
      Math.floor(
        seconds / 60
      );


    if (
      minutes < 60
    ) {

      return `${minutes}m ago`;

    }


    const hours =
      Math.floor(
        minutes / 60
      );


    if (
      hours < 24
    ) {

      return `${hours}h ago`;

    }


    const days =
      Math.floor(
        hours / 24
      );


    return `${days}d ago`;

  };


  // ==========================================================
  // STATUS BADGE
  // ==========================================================

  const getStatusBadge = (
    status: string
  ) => {

    switch (status) {

      case 'open':

        return (
          <Badge
            className="
              bg-amber-100
              text-amber-800
              hover:bg-amber-100
              whitespace-nowrap
            "
          >
            Open
          </Badge>
        );


      case 'in-progress':

        return (
          <Badge
            className="
              bg-blue-100
              text-blue-800
              hover:bg-blue-100
              whitespace-nowrap
            "
          >
            In Progress
          </Badge>
        );


      case 'resolved':

        return (
          <Badge
            className="
              bg-green-100
              text-green-800
              hover:bg-green-100
              whitespace-nowrap
            "
          >
            Resolved
          </Badge>
        );


      default:

        return (
          <Badge
            variant="outline"
          >
            {status}
          </Badge>
        );

    }

  };


  // ==========================================================
  // TOTAL
  // ==========================================================

  const totalComplaints =
    stats.open +
    stats['in-progress'] +
    stats.resolved;


  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {

    await fetchSocieties();

    await fetchComplaints(
      pagination.current
    );

  };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="
        w-full
        min-w-0
        max-w-full
        overflow-x-hidden
        space-y-5
        sm:space-y-6
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          min-w-0
          flex
          flex-col
          sm:flex-row
          sm:items-start
          sm:justify-between
          gap-3
        "
      >

        <div className="min-w-0">

          <h1
            className="
              text-2xl
              sm:text-3xl
              font-bold
              text-gray-900
              truncate
            "
          >
            All Complaints
          </h1>

          <p
            className="
              text-sm
              sm:text-base
              text-gray-600
              mt-1
            "
          >
            Manage complaints from all residents
          </p>

        </div>


        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={
            dataLoading ||
            societiesLoading
          }
        >
          <RefreshCw
            className={`
              w-4
              h-4
              mr-2
              ${
                dataLoading
                  ? 'animate-spin'
                  : ''
              }
            `}
          />

          Refresh
        </Button>

      </div>


      {/* ======================================================
          SOCIETY FILTER
      ====================================================== */}

      <Card>

        <CardHeader
          className="pb-3"
        >

          <CardTitle
            className="text-base"
          >
            Society
          </CardTitle>

          <CardDescription>
            Select a society to view only its complaints
          </CardDescription>

        </CardHeader>


        <CardContent>

          <Select
            value={
              selectedSocietyId
            }
            onValueChange={
              handleSocietyChange
            }
            disabled={
              societiesLoading
            }
          >

            <SelectTrigger
              className="
                w-full
                sm:w-[320px]
              "
            >

              <SelectValue
                placeholder="Select Society"
              />

            </SelectTrigger>


            <SelectContent>

              <SelectItem
                value="all"
              >
                All Societies
              </SelectItem>


              {societies.map(
                society => (

                  <SelectItem
                    key={
                      society._id
                    }
                    value={
                      society._id
                    }
                  >
                    {society.name}
                    {' '}
                    ({society.society_code})
                  </SelectItem>

                )
              )}

            </SelectContent>

          </Select>

        </CardContent>

      </Card>


      {/* ======================================================
          SELECTED SOCIETY TITLE
      ====================================================== */}

      <div
        className="
          rounded-lg
          border
          bg-white
          px-4
          py-3
        "
      >

        <p
          className="
            text-sm
            text-gray-500
          "
        >
          Showing complaints for
        </p>

        <p
          className="
            text-lg
            font-semibold
            text-gray-900
          "
        >
          {selectedSocietyName}
        </p>

      </div>


      {/* ======================================================
          STATS
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-3
          sm:gap-4
          min-w-0
        "
      >

        {/* TOTAL */}

        <Card
          className={`
            cursor-pointer
            transition-all
            min-w-0
            ${
              statusFilter === 'all'
                ? 'ring-2 ring-blue-500'
                : ''
            }
          `}
          onClick={() =>
            setStatusFilter('all')
          }
        >

          <CardContent
            className="
              p-4
              sm:pt-6
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                sm:gap-4
                min-w-0
              "
            >

              <div
                className="
                  p-2.5
                  sm:p-3
                  bg-gray-100
                  rounded-full
                  flex-shrink-0
                "
              >

                <span
                  className="
                    text-xl
                    sm:text-2xl
                  "
                >
                  📊
                </span>

              </div>


              <div
                className="min-w-0"
              >

                <p
                  className="
                    text-xs
                    sm:text-sm
                    text-gray-500
                  "
                >
                  Total
                </p>

                <p
                  className="
                    text-xl
                    sm:text-2xl
                    font-bold
                  "
                >
                  {totalComplaints}
                </p>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* OPEN */}

        <Card
          className={`
            cursor-pointer
            transition-all
            border-0
            shadow-sm
            min-w-0
            ${
              statusFilter === 'open'
                ? 'ring-2 ring-amber-500'
                : ''
            }
          `}
          onClick={() =>
            setStatusFilter('open')
          }
        >

          <CardContent
            className="
              p-4
              sm:pt-6
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                sm:gap-4
                min-w-0
              "
            >

              <div
                className="
                  p-2.5
                  sm:p-3
                  bg-amber-100
                  rounded-xl
                  flex-shrink-0
                "
              >

                <ClipboardList
                  className="
                    w-5
                    h-5
                    sm:w-6
                    sm:h-6
                    text-amber-600
                  "
                />

              </div>


              <div
                className="min-w-0"
              >

                <p
                  className="
                    text-xs
                    sm:text-sm
                    text-gray-500
                  "
                >
                  Open
                </p>

                <p
                  className="
                    text-xl
                    sm:text-2xl
                    font-bold
                    text-amber-600
                  "
                >
                  {stats.open}
                </p>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* IN PROGRESS */}

        <Card
          className={`
            cursor-pointer
            transition-all
            border-0
            shadow-sm
            min-w-0
            ${
              statusFilter ===
              'in-progress'
                ? 'ring-2 ring-blue-500'
                : ''
            }
          `}
          onClick={() =>
            setStatusFilter(
              'in-progress'
            )
          }
        >

          <CardContent
            className="
              p-4
              sm:pt-6
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                sm:gap-4
                min-w-0
              "
            >

              <div
                className="
                  p-2.5
                  sm:p-3
                  bg-blue-100
                  rounded-xl
                  flex-shrink-0
                "
              >

                <RefreshCw
                  className="
                    w-5
                    h-5
                    sm:w-6
                    sm:h-6
                    text-blue-600
                  "
                />

              </div>


              <div
                className="min-w-0"
              >

                <p
                  className="
                    text-xs
                    sm:text-sm
                    text-gray-500
                  "
                >
                  In Progress
                </p>

                <p
                  className="
                    text-xl
                    sm:text-2xl
                    font-bold
                    text-blue-600
                  "
                >
                  {stats['in-progress']}
                </p>

              </div>

            </div>

          </CardContent>

        </Card>


        {/* RESOLVED */}

        <Card
          className={`
            cursor-pointer
            transition-all
            border-0
            shadow-sm
            min-w-0
            ${
              statusFilter === 'resolved'
                ? 'ring-2 ring-green-500'
                : ''
            }
          `}
          onClick={() =>
            setStatusFilter(
              'resolved'
            )
          }
        >

          <CardContent
            className="
              p-4
              sm:pt-6
            "
          >

            <div
              className="
                flex
                items-center
                gap-3
                sm:gap-4
                min-w-0
              "
            >

              <div
                className="
                  p-2.5
                  sm:p-3
                  bg-green-100
                  rounded-xl
                  flex-shrink-0
                "
              >

                <CheckCircle
                  className="
                    w-5
                    h-5
                    sm:w-6
                    sm:h-6
                    text-green-600
                  "
                />

              </div>


              <div
                className="min-w-0"
              >

                <p
                  className="
                    text-xs
                    sm:text-sm
                    text-gray-500
                  "
                >
                  Resolved
                </p>

                <p
                  className="
                    text-xl
                    sm:text-2xl
                    font-bold
                    text-green-600
                  "
                >
                  {stats.resolved}
                </p>

              </div>

            </div>

          </CardContent>

        </Card>

      </div>


      {/* ======================================================
          COMPLAINT LIST
      ====================================================== */}

      <Card
        className="
          min-w-0
          overflow-hidden
        "
      >

        <CardHeader
          className="min-w-0"
        >

          <CardTitle
            className="text-lg"
          >
            Complaint List
          </CardTitle>

          <CardDescription>

            {selectedSocietyId === 'all'
              ? 'Complaints from all societies'
              : `Complaints from ${selectedSocietyName}`}

          </CardDescription>

        </CardHeader>


        <CardContent
          className="min-w-0"
        >

          {dataLoading ? (

            <div
              className="space-y-4"
            >

              {[1, 2, 3, 4, 5].map(
                i => (

                  <div
                    key={i}
                    className="
                      animate-pulse
                      flex
                      items-center
                      gap-4
                      p-4
                      border
                      rounded-lg
                    "
                  >

                    <div
                      className="
                        h-12
                        w-12
                        bg-gray-200
                        rounded
                      "
                    />

                    <div
                      className="
                        flex-1
                        space-y-2
                      "
                    >

                      <div
                        className="
                          h-4
                          bg-gray-200
                          rounded
                          w-3/4
                        "
                      />

                      <div
                        className="
                          h-3
                          bg-gray-200
                          rounded
                          w-1/2
                        "
                      />

                    </div>

                  </div>

                )
              )}

            </div>

          ) : complaints.length === 0 ? (

            <div
              className="
                text-center
                py-12
              "
            >

              <span
                className="
                  text-5xl
                  mb-4
                  block
                "
              >
                📭
              </span>

              <h3
                className="
                  text-lg
                  font-medium
                  text-gray-900
                "
              >
                No complaints found
              </h3>

              <p
                className="
                  text-gray-500
                  mt-1
                "
              >

                {statusFilter !== 'all'
                  ? 'No complaints with this status.'
                  : selectedSocietyId !== 'all'
                    ? `No complaints have been filed in ${selectedSocietyName}.`
                    : 'No complaints have been filed yet.'}

              </p>

            </div>

          ) : (

            <>

              {/* ==================================================
                  MOBILE / TABLET
              ================================================== */}

              <div
                className="
                  space-y-3
                  lg:hidden
                  min-w-0
                "
              >

                {complaints.map(
                  complaint => (

                    <div
                      key={
                        complaint._id
                      }
                      className="
                        w-full
                        min-w-0
                        rounded-xl
                        border
                        border-gray-200
                        bg-white
                        p-4
                        space-y-4
                        overflow-hidden
                      "
                    >

                      {/* RESIDENT + SOCIETY */}

                      <div
                        className="
                          flex
                          items-start
                          justify-between
                          gap-3
                          min-w-0
                        "
                      >

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >

                          <p
                            className="
                              font-semibold
                              text-gray-900
                              truncate
                            "
                          >
                            {
                              complaint.user_id
                                .name
                            }
                          </p>

                          <p
                            className="
                              text-xs
                              text-gray-500
                              mt-1
                              break-all
                            "
                          >
                            {
                              complaint.user_id
                                .email
                            }
                          </p>

                          <div
                            className="
                              mt-2
                              flex
                              flex-wrap
                              gap-2
                            "
                          >

                            <Badge
                              variant="outline"
                            >
                              Flat{' '}
                              {
                                complaint.flat_no
                              }
                            </Badge>


                            {typeof complaint.society_id !==
                              'string' && (
                              <Badge
                                variant="secondary"
                              >
                                {
                                  complaint
                                    .society_id
                                    .society_code
                                }
                              </Badge>
                            )}

                          </div>

                        </div>


                        <div
                          className="
                            flex-shrink-0
                          "
                        >
                          {getStatusBadge(
                            complaint.status
                          )}
                        </div>

                      </div>


                      {/* DESCRIPTION */}

                      <div
                        className="min-w-0"
                      >

                        <p
                          className="
                            text-xs
                            text-gray-500
                            mb-1
                          "
                        >
                          Description
                        </p>


                        <div
                          className="
                            flex
                            items-start
                            gap-3
                            min-w-0
                          "
                        >

                          {complaint.image_url && (

                            <div
                              className="
                                relative
                                w-12
                                h-12
                                rounded-lg
                                overflow-hidden
                                flex-shrink-0
                              "
                            >

                              <Image
                                src={
                                  complaint.image_url
                                }
                                alt="Complaint"
                                fill
                                className="
                                  object-cover
                                "
                              />

                            </div>

                          )}


                          <p
                            className="
                              text-sm
                              text-gray-700
                              break-words
                              leading-5
                              min-w-0
                            "
                          >
                            {
                              complaint.description
                            }
                          </p>

                        </div>

                      </div>


                      {/* DATE */}

                      <div
                        className="
                          grid
                          grid-cols-2
                          gap-3
                          text-sm
                        "
                      >

                        <div>

                          <p
                            className="
                              text-xs
                              text-gray-500
                            "
                          >
                            Submitted
                          </p>

                          <p
                            className="
                              font-medium
                              text-gray-900
                              mt-1
                            "
                          >
                            {getTimeAgo(
                              complaint.created_at
                            )}
                          </p>

                        </div>


                        <div>

                          <p
                            className="
                              text-xs
                              text-gray-500
                            "
                          >
                            Date
                          </p>

                          <p
                            className="
                              text-xs
                              text-gray-700
                              mt-1
                            "
                          >
                            {formatDate(
                              complaint.created_at
                            )}
                          </p>

                        </div>

                      </div>


                      {/* MANAGE */}

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

                  )
                )}

              </div>


              {/* ==================================================
                  DESKTOP TABLE
              ================================================== */}

              <div
                className="
                  hidden
                  lg:block
                  overflow-x-auto
                "
              >

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead>
                        Society
                      </TableHead>

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

                    {complaints.map(
                      complaint => (

                        <TableRow
                          key={
                            complaint._id
                          }
                          className="
                            hover:bg-gray-50
                          "
                        >

                          {/* SOCIETY */}

                          <TableCell>

                            {typeof complaint.society_id !==
                            'string' ? (

                              <div>

                                <p
                                  className="
                                    font-medium
                                  "
                                >
                                  {
                                    complaint
                                      .society_id
                                      .name
                                  }
                                </p>

                                <p
                                  className="
                                    text-xs
                                    text-gray-500
                                  "
                                >
                                  {
                                    complaint
                                      .society_id
                                      .society_code
                                  }
                                </p>

                              </div>

                            ) : (

                              <span>
                                -
                              </span>

                            )}

                          </TableCell>


                          {/* RESIDENT */}

                          <TableCell>

                            <div>

                              <p
                                className="
                                  font-medium
                                "
                              >
                                {
                                  complaint
                                    .user_id
                                    .name
                                }
                              </p>

                              <p
                                className="
                                  text-sm
                                  text-gray-500
                                  break-all
                                "
                              >
                                {
                                  complaint
                                    .user_id
                                    .email
                                }
                              </p>

                            </div>

                          </TableCell>


                          {/* FLAT */}

                          <TableCell>

                            <Badge
                              variant="outline"
                            >
                              {
                                complaint.flat_no
                              }
                            </Badge>

                          </TableCell>


                          {/* DESCRIPTION */}

                          <TableCell
                            className="
                              max-w-xs
                            "
                          >

                            <div
                              className="
                                flex
                                items-center
                                gap-2
                              "
                            >

                              {complaint.image_url && (

                                <div
                                  className="
                                    relative
                                    w-8
                                    h-8
                                    rounded
                                    overflow-hidden
                                    flex-shrink-0
                                  "
                                >

                                  <Image
                                    src={
                                      complaint.image_url
                                    }
                                    alt="Complaint"
                                    fill
                                    className="
                                      object-cover
                                    "
                                  />

                                </div>

                              )}


                              <p
                                className="
                                  truncate
                                "
                              >
                                {
                                  complaint.description
                                }
                              </p>

                            </div>

                          </TableCell>


                          {/* STATUS */}

                          <TableCell>

                            {getStatusBadge(
                              complaint.status
                            )}

                          </TableCell>


                          {/* SUBMITTED */}

                          <TableCell>

                            <div>

                              <p
                                className="
                                  text-sm
                                "
                              >
                                {getTimeAgo(
                                  complaint.created_at
                                )}
                              </p>

                              <p
                                className="
                                  text-xs
                                  text-gray-400
                                "
                              >
                                {formatDate(
                                  complaint.created_at
                                )}
                              </p>

                            </div>

                          </TableCell>


                          {/* ACTION */}

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

                      )
                    )}

                  </TableBody>

                </Table>

              </div>


              {/* ==================================================
                  PAGINATION
              ================================================== */}

              {pagination.pages > 1 && (

                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    mt-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                    min-w-0
                  "
                >

                  <p
                    className="
                      text-sm
                      text-gray-500
                    "
                  >

                    Showing{' '}

                    {(
                      (
                        pagination.current -
                        1
                      ) *
                      pagination.limit
                    ) + 1}

                    {' '}to{' '}

                    {Math.min(
                      pagination.current *
                        pagination.limit,
                      pagination.total
                    )}

                    {' '}of{' '}

                    {pagination.total}

                  </p>


                  <div
                    className="
                      flex
                      gap-2
                      w-full
                      sm:w-auto
                    "
                  >

                    <Button
                      variant="outline"
                      size="sm"
                      className="
                        flex-1
                        sm:flex-none
                      "
                      disabled={
                        pagination.current ===
                        1
                      }
                      onClick={() =>
                        fetchComplaints(
                          pagination.current -
                            1
                        )
                      }
                    >
                      Previous
                    </Button>


                    <Button
                      variant="outline"
                      size="sm"
                      className="
                        flex-1
                        sm:flex-none
                      "
                      disabled={
                        pagination.current ===
                        pagination.pages
                      }
                      onClick={() =>
                        fetchComplaints(
                          pagination.current +
                            1
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


      {/* ======================================================
          UPDATE DIALOG
      ====================================================== */}

      <Dialog
        open={
          updateDialogOpen
        }
        onOpenChange={
          setUpdateDialogOpen
        }
      >

        <DialogContent
          className="
            w-[calc(100%-2rem)]
            sm:max-w-2xl
            max-h-[90vh]
            overflow-y-auto
            rounded-xl
          "
        >

          <DialogHeader>

            <DialogTitle>
              Manage Complaint
            </DialogTitle>

            <DialogDescription>
              Update the status and add notes for the resident
            </DialogDescription>

          </DialogHeader>


          {selectedComplaint && (

            <div
              className="
                space-y-4
                min-w-0
              "
            >

              {/* COMPLAINT INFO */}

              <div
                className="
                  bg-gray-50
                  p-4
                  rounded-lg
                  space-y-2
                "
              >

                <div
                  className="
                    flex
                    items-start
                    justify-between
                    gap-3
                  "
                >

                  <div
                    className="min-w-0"
                  >

                    <p
                      className="
                        font-medium
                        truncate
                      "
                    >
                      {
                        selectedComplaint
                          .user_id
                          .name
                      }
                    </p>

                    <p
                      className="
                        text-sm
                        text-gray-500
                      "
                    >
                      Flat{' '}
                      {
                        selectedComplaint
                          .flat_no
                      }
                    </p>

                  </div>


                  <div
                    className="
                      flex-shrink-0
                    "
                  >
                    {getStatusBadge(
                      selectedComplaint.status
                    )}
                  </div>

                </div>


                {/* SOCIETY */}

                {typeof selectedComplaint.society_id !==
                  'string' && (

                  <p
                    className="
                      text-sm
                      text-blue-600
                      font-medium
                    "
                  >
                    Society:{' '}
                    {
                      selectedComplaint
                        .society_id
                        .name
                    }
                    {' '}
                    (
                    {
                      selectedComplaint
                        .society_id
                        .society_code
                    }
                    )
                  </p>

                )}


                <p
                  className="
                    text-sm
                    text-gray-600
                  "
                >
                  Submitted:{' '}
                  {formatDate(
                    selectedComplaint
                      .created_at
                  )}
                </p>

              </div>


              {/* IMAGE */}

              {selectedComplaint.image_url && (

                <div
                  className="
                    relative
                    w-full
                    h-40
                    sm:h-48
                    rounded-lg
                    overflow-hidden
                    border
                  "
                >

                  <Image
                    src={
                      selectedComplaint
                        .image_url
                    }
                    alt="Complaint image"
                    fill
                    className="
                      object-contain
                    "
                  />

                </div>

              )}


              {/* DESCRIPTION */}

              <div
                className="min-w-0"
              >

                <Label
                  className="
                    text-gray-500
                  "
                >
                  Description
                </Label>

                <p
                  className="
                    mt-1
                    text-gray-900
                    bg-white
                    p-3
                    rounded-lg
                    border
                    break-words
                  "
                >
                  {
                    selectedComplaint
                      .description
                  }
                </p>

              </div>


              {/* STATUS */}

              <div
                className="space-y-2"
              >

                <Label
                  htmlFor="status"
                >
                  Update Status
                </Label>


                <Select
                  value={
                    newStatus
                  }
                  onValueChange={
                    setNewStatus
                  }
                >

                  <SelectTrigger
                    className="w-full"
                  >
                    <SelectValue
                      placeholder="Select new status"
                    />
                  </SelectTrigger>


                  <SelectContent>

                    <SelectItem
                      value="open"
                    >
                      Open
                    </SelectItem>

                    <SelectItem
                      value="in-progress"
                    >
                      In Progress
                    </SelectItem>

                    <SelectItem
                      value="resolved"
                    >
                      Resolved
                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>


              {/* ADMIN NOTES */}

              <div
                className="space-y-2"
              >

                <Label
                  htmlFor="adminNotes"
                >
                  Admin Notes
                </Label>

                <Textarea
                  id="adminNotes"
                  value={
                    adminNotes
                  }
                  onChange={e =>
                    setAdminNotes(
                      e.target.value
                    )
                  }
                  placeholder="
                    Add notes for the resident
                  "
                  rows={3}
                  className="
                    w-full
                    min-w-0
                  "
                />

              </div>

            </div>

          )}


          <DialogFooter
            className="
              flex-col-reverse
              sm:flex-row
              gap-2
            "
          >

            <Button
              variant="outline"
              className="
                w-full
                sm:w-auto
              "
              onClick={() =>
                setUpdateDialogOpen(
                  false
                )
              }
              disabled={
                updateLoading
              }
            >
              Cancel
            </Button>


            <Button
              className="
                w-full
                sm:w-auto
              "
              onClick={
                handleStatusUpdate
              }
              disabled={
                updateLoading ||
                !newStatus
              }
            >

              {updateLoading ? (

                <>
                  <span
                    className="
                      animate-spin
                      h-4
                      w-4
                      border-2
                      border-white
                      border-t-transparent
                      rounded-full
                      mr-2
                    "
                  />

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