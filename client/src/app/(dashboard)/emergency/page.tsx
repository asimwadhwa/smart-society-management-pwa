'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useEmergency,
  Emergency,
  EmergencyHistory,
} from '@/hooks/useEmergency';
import { useToast } from '@/hooks/use-toast';
import EmergencyButton from '@/components/dashboard/EmergencyButton';
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
  Siren,
  Mail,
  Bell,
  CheckCircle,
  ArrowUpDown,
  ClipboardList,
  Loader2,
} from 'lucide-react';

export default function EmergencyPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    activeEmergency,
    triggerEmergency,
    resolveEmergency,
    getEmergencyHistory,
  } = useEmergency();

  const [history, setHistory] =
    useState<EmergencyHistory | null>(null);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [triggerLoading, setTriggerLoading] =
    useState(false);

  const [resolveLoading, setResolveLoading] =
    useState(false);

  const [resolveDialogOpen, setResolveDialogOpen] =
    useState(false);

  const [selectedEmergency, setSelectedEmergency] =
    useState<Emergency | null>(null);

  const [resolveNotes, setResolveNotes] =
    useState('');

  const isManagerOrAdmin =
    user?.role === 'manager' ||
    user?.role === 'admin';

  const hasActiveEmergency =
    activeEmergency !== null;

  const fetchHistory = useCallback(
    async (page: number) => {
      setHistoryLoading(true);

      try {
        const data =
          await getEmergencyHistory(page, 10);

        setHistory(data);
        setCurrentPage(page);
      } catch (error) {
        console.error(
          'Failed to fetch history:',
          error
        );
      } finally {
        setHistoryLoading(false);
      }
    },
    [getEmergencyHistory]
  );

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleTrigger = async (
    notes?: string
  ) => {
    setTriggerLoading(true);

    try {
      await triggerEmergency(notes);

      toast({
        title: 'Emergency alert sent!',
        description:
          'All residents and staff have been notified.',
      });

      fetchHistory(1);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Please try again';

      toast({
        title: 'Failed to send alert',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  const openResolveDialog = (
    emergency: Emergency
  ) => {
    setSelectedEmergency(emergency);
    setResolveNotes('');
    setResolveDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedEmergency) return;

    setResolveLoading(true);

    try {
      await resolveEmergency(
        selectedEmergency._id,
        resolveNotes
      );

      toast({
        title: 'Emergency resolved!',
        description:
          'All residents have been notified that the situation is resolved.',
      });

      setResolveDialogOpen(false);
      setSelectedEmergency(null);
      setResolveNotes('');

      fetchHistory(1);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Please try again';

      toast({
        title: 'Failed to resolve emergency',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setResolveLoading(false);
    }
  };

  const formatDate = (
    dateString: string
  ) => {
    return new Date(
      dateString
    ).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (
    dateString: string
  ) => {
    const seconds = Math.floor(
      (Date.now() -
        new Date(dateString).getTime()) /
        1000
    );

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes =
      Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours =
      Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days =
      Math.floor(hours / 24);

    return `${days}d ago`;
  };

  const getResponseTime = (
    emergency: Emergency
  ) => {
    if (!emergency.resolved_at) {
      return null;
    }

    const start =
      new Date(
        emergency.triggered_at
      ).getTime();

    const end =
      new Date(
        emergency.resolved_at
      ).getTime();

    const minutes =
      Math.floor(
        (end - start) / 60000
      );

    if (minutes < 1) {
      return 'Under 1 min';
    }

    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours =
      Math.floor(minutes / 60);

    return `${hours}h ${
      minutes % 60
    }m`;
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
          Lift Emergency
        </h1>

        <p className="text-gray-600 mt-1">
          Trigger an emergency alert or view history
        </p>
      </div>


      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* LEFT COLUMN */}
        <div className="space-y-6">

          {/* Emergency Trigger */}
          <Card className="border-0 shadow-sm overflow-hidden">

            <CardHeader className="px-4 sm:px-6">

              <CardTitle className="flex items-center gap-2">

                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                  <Siren className="w-4 h-4 text-red-600" />
                </div>

                Emergency Alert

              </CardTitle>

              <CardDescription>
                Use this button if you or someone is stuck in the lift
              </CardDescription>

            </CardHeader>


            <CardContent className="px-4 sm:px-6">

              <EmergencyButton
                onTrigger={handleTrigger}
                hasActiveEmergency={
                  hasActiveEmergency
                }
                userFlat={
                  user?.flat_no ||
                  'Unknown'
                }
                triggerLoading={
                  triggerLoading
                }
              />

            </CardContent>

          </Card>


          {/* Instructions */}
          <Card className="border-0 shadow-sm">

            <CardHeader className="px-4 sm:px-6">

              <CardTitle className="text-lg">
                What happens when you trigger?
              </CardTitle>

            </CardHeader>


            <CardContent className="space-y-4 px-4 sm:px-6">

              {/* Email */}
              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>

                <div className="min-w-0">
                  <p className="font-medium">
                    Email Notifications
                  </p>

                  <p className="text-sm text-gray-500 break-words">
                    All residents, manager, and watchman receive instant email alerts
                  </p>
                </div>

              </div>


              {/* Dashboard */}
              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>

                <div className="min-w-0">
                  <p className="font-medium">
                    Dashboard Alert
                  </p>

                  <p className="text-sm text-gray-500 break-words">
                    A red banner appears on everyone&apos;s dashboard
                  </p>
                </div>

              </div>


              {/* Resolution */}
              <div className="flex items-start gap-3">

                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>

                <div className="min-w-0">
                  <p className="font-medium">
                    Resolution
                  </p>

                  <p className="text-sm text-gray-500 break-words">
                    Manager or Admin will resolve the emergency once help arrives
                  </p>
                </div>

              </div>

            </CardContent>

          </Card>

        </div>


        {/* RIGHT COLUMN */}
        <div className="space-y-6">

          {/* ACTIVE EMERGENCY */}
          <Card
            className={`border-0 shadow-sm overflow-hidden ${
              hasActiveEmergency
                ? 'border-red-300 bg-red-50'
                : ''
            }`}
          >

            <CardHeader className="px-4 sm:px-6">

              <CardTitle className="flex items-center gap-2">

                {hasActiveEmergency ? (

                  <>
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center animate-pulse shrink-0">
                      <Siren className="w-4 h-4 text-red-600" />
                    </div>

                    <span className="text-red-600">
                      Active Emergency
                    </span>
                  </>

                ) : (

                  <>
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>

                    <span className="text-green-600">
                      All Clear
                    </span>
                  </>

                )}

              </CardTitle>


              <CardDescription>
                {hasActiveEmergency
                  ? 'An emergency alert is currently active'
                  : 'No active emergencies at this time'}
              </CardDescription>

            </CardHeader>


            <CardContent className="px-4 sm:px-6">

              {hasActiveEmergency &&
              activeEmergency ? (

                <div className="space-y-4">

                  <div className="bg-white rounded-lg border border-red-200 p-4 space-y-3">

                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">

                      <div className="min-w-0">

                        <p className="font-semibold text-red-700 break-words">
                          Triggered by:{' '}
                          {
                            activeEmergency
                              .triggered_by
                              .name
                          }
                        </p>

                        <p className="text-sm text-gray-600 break-words">
                          Flat{' '}
                          {
                            activeEmergency
                              .triggered_by
                              .flat_no
                          }
                          {' • '}
                          {getTimeAgo(
                            activeEmergency.triggered_at
                          )}
                        </p>

                      </div>


                      <Badge
                        variant="destructive"
                        className="animate-pulse w-fit"
                      >
                        ACTIVE
                      </Badge>

                    </div>


                    {activeEmergency.notes && (

                      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">

                        <p className="text-sm text-yellow-800 break-words whitespace-pre-wrap">
                          <strong>
                            Note:
                          </strong>{' '}
                          {
                            activeEmergency.notes
                          }
                        </p>

                      </div>

                    )}


                    <p className="text-xs text-gray-500 break-words">
                      {formatDate(
                        activeEmergency.triggered_at
                      )}
                    </p>


                    {isManagerOrAdmin && (

                      <Button
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          openResolveDialog(
                            activeEmergency
                          )
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />

                        Mark as Resolved
                      </Button>

                    )}

                  </div>

                </div>

              ) : (

                <div className="text-center py-8 text-gray-500">

                  <ArrowUpDown className="w-12 h-12 mx-auto mb-2 text-gray-300" />

                  <p>
                    The lift is operating normally
                  </p>

                </div>

              )}

            </CardContent>

          </Card>


          {/* STATISTICS */}
          {history && (

            <Card>

              <CardHeader className="px-4 sm:px-6">

                <CardTitle className="text-lg">
                  Statistics
                </CardTitle>

              </CardHeader>


              <CardContent className="px-4 sm:px-6">

                <div className="grid grid-cols-2 gap-3 sm:gap-4">

                  <div className="text-center p-3 bg-gray-50 rounded-lg">

                    <p className="text-2xl font-bold text-gray-900">
                      {
                        history
                          .pagination
                          .total
                      }
                    </p>

                    <p className="text-sm text-gray-500">
                      Total Alerts
                    </p>

                  </div>


                  <div className="text-center p-3 bg-gray-50 rounded-lg">

                    <p className="text-2xl font-bold text-green-600">
                      {
                        history.data.filter(
                          (
                            emergency:
                              Emergency
                          ) =>
                            emergency.status ===
                            'resolved'
                        ).length
                      }
                    </p>

                    <p className="text-sm text-gray-500">
                      Resolved
                    </p>

                  </div>

                </div>

              </CardContent>

            </Card>

          )}

        </div>

      </div>


      {/* ================================================= */}
      {/* EMERGENCY HISTORY */}
      {/* ================================================= */}

      <Card className="border-0 shadow-sm w-full max-w-full overflow-hidden">

        <CardHeader className="px-4 sm:px-6">

          <CardTitle className="flex items-center gap-2">

            <ClipboardList className="w-5 h-5 text-blue-600 shrink-0" />

            Emergency History

          </CardTitle>

          <CardDescription>
            Past emergency alerts and their resolutions
          </CardDescription>

        </CardHeader>


        <CardContent className="px-4 sm:px-6">

          {historyLoading ? (

            <div className="flex justify-center py-8">

              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />

            </div>

          ) : history &&
          history.data.length > 0 ? (

            <>

              {/* ================================================= */}
              {/* MOBILE HISTORY CARDS */}
              {/* ================================================= */}

              <div className="md:hidden space-y-4">

                {history.data.map(
                  (
                    emergency:
                      Emergency
                  ) => (

                    <div
                      key={
                        emergency._id
                      }
                      className="w-full border rounded-xl p-4 bg-white shadow-sm overflow-hidden"
                    >

                      {/* DATE */}

                      <div className="mb-4">

                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Date
                        </p>

                        <p className="text-sm font-medium text-gray-900 break-words">
                          {formatDate(
                            emergency.triggered_at
                          )}
                        </p>

                      </div>


                      {/* TRIGGERED BY */}

                      <div className="mb-4">

                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Triggered By
                        </p>

                        <p className="text-sm font-medium text-gray-900 break-words">
                          {
                            emergency
                              .triggered_by
                              .name
                          }
                        </p>

                        <p className="text-xs text-gray-500">
                          Flat{' '}
                          {
                            emergency
                              .triggered_by
                              .flat_no
                          }
                        </p>

                      </div>


                      {/* STATUS */}

                      <div className="mb-4">

                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Status
                        </p>

                        <Badge
                          variant={
                            emergency.status ===
                            'active'
                              ? 'destructive'
                              : 'default'
                          }
                          className={
                            emergency.status ===
                            'resolved'
                              ? 'bg-green-100 text-green-800'
                              : ''
                          }
                        >
                          {emergency.status.toUpperCase()}
                        </Badge>

                      </div>


                      {/* RESOLVED BY */}

                      <div className="mb-4">

                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Resolved By
                        </p>

                        <p className="text-sm text-gray-900 break-words">
                          {emergency.resolved_by
                            ? emergency
                                .resolved_by
                                .name
                            : '—'}
                        </p>

                      </div>


                      {/* RESPONSE TIME */}

                      <div className="mb-4">

                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Response Time
                        </p>

                        <p className="text-sm text-gray-900">
                          {getResponseTime(
                            emergency
                          ) || '—'}
                        </p>

                      </div>


                      {/* NOTES */}

                      <div>

                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Notes
                        </p>

                        <p className="text-sm text-gray-600 break-words whitespace-pre-wrap">
                          {
                            emergency.notes ||
                            '—'
                          }
                        </p>

                      </div>


                      {/* MANAGER RESOLVE BUTTON */}

                      {isManagerOrAdmin &&
                        emergency.status ===
                          'active' && (

                          <Button
                            className="w-full mt-4 bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              openResolveDialog(
                                emergency
                              )
                            }
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />

                            Resolve Emergency
                          </Button>

                        )}

                    </div>

                  )
                )}

              </div>


              {/* ================================================= */}
              {/* DESKTOP TABLE */}
              {/* ================================================= */}

              <div className="hidden md:block overflow-x-auto">

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead>
                        Date
                      </TableHead>

                      <TableHead>
                        Triggered By
                      </TableHead>

                      <TableHead>
                        Status
                      </TableHead>

                      <TableHead>
                        Resolved By
                      </TableHead>

                      <TableHead>
                        Response Time
                      </TableHead>

                      <TableHead>
                        Notes
                      </TableHead>

                    </TableRow>

                  </TableHeader>


                  <TableBody>

                    {history.data.map(
                      (
                        emergency:
                          Emergency
                      ) => (

                        <TableRow
                          key={
                            emergency._id
                          }
                        >

                          <TableCell className="whitespace-nowrap">

                            {formatDate(
                              emergency.triggered_at
                            )}

                          </TableCell>


                          <TableCell>

                            <div>

                              <p className="font-medium">
                                {
                                  emergency
                                    .triggered_by
                                    .name
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                Flat{' '}
                                {
                                  emergency
                                    .triggered_by
                                    .flat_no
                                }
                              </p>

                            </div>

                          </TableCell>


                          <TableCell>

                            <Badge
                              variant={
                                emergency.status ===
                                'active'
                                  ? 'destructive'
                                  : 'default'
                              }
                              className={
                                emergency.status ===
                                'resolved'
                                  ? 'bg-green-100 text-green-800'
                                  : ''
                              }
                            >
                              {emergency.status.toUpperCase()}
                            </Badge>

                          </TableCell>


                          <TableCell>

                            {emergency.resolved_by ? (

                              <p className="font-medium">
                                {
                                  emergency
                                    .resolved_by
                                    .name
                                }
                              </p>

                            ) : (

                              <span className="text-gray-400">
                                —
                              </span>

                            )}

                          </TableCell>


                          <TableCell>

                            {getResponseTime(
                              emergency
                            ) || (

                              <span className="text-gray-400">
                                —
                              </span>

                            )}

                          </TableCell>


                          <TableCell className="max-w-[200px]">

                            <p className="truncate text-sm text-gray-600">
                              {
                                emergency.notes ||
                                '—'
                              }
                            </p>

                          </TableCell>

                        </TableRow>

                      )
                    )}

                  </TableBody>

                </Table>

              </div>


              {/* PAGINATION */}

              {history.pagination.pages >
                1 && (

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 mt-6">

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage === 1
                    }
                    onClick={() =>
                      fetchHistory(
                        currentPage - 1
                      )
                    }
                  >
                    Previous
                  </Button>


                  <span className="text-center px-2 text-sm text-gray-600">

                    Page {currentPage} of{' '}
                    {
                      history
                        .pagination
                        .pages
                    }

                  </span>


                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage ===
                      history.pagination
                        .pages
                    }
                    onClick={() =>
                      fetchHistory(
                        currentPage + 1
                      )
                    }
                  >
                    Next
                  </Button>

                </div>

              )}

            </>

          ) : (

            <div className="text-center py-8 text-gray-500">

              <span className="text-4xl block mb-2">
                📭
              </span>

              <p>
                No emergency history yet
              </p>

            </div>

          )}

        </CardContent>

      </Card>


      {/* ================================================= */}
      {/* RESOLVE DIALOG */}
      {/* ================================================= */}

      <Dialog
        open={resolveDialogOpen}
        onOpenChange={(open) => {

          if (!resolveLoading) {

            setResolveDialogOpen(
              open
            );

            if (!open) {
              setSelectedEmergency(
                null
              );

              setResolveNotes('');
            }
          }

        }}
      >

        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[90vh] overflow-y-auto">

          <DialogHeader>

            <DialogTitle className="flex items-center gap-2 text-green-600">

              <CheckCircle className="w-5 h-5 shrink-0" />

              Resolve Emergency

            </DialogTitle>


            <DialogDescription>
              Confirm that the emergency has been resolved and help has arrived.
            </DialogDescription>

          </DialogHeader>


          {selectedEmergency && (

            <div className="space-y-4">

              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">

                <p className="text-gray-600 break-words">
                  Triggered by:{' '}

                  <strong>
                    {
                      selectedEmergency
                        .triggered_by
                        .name
                    }
                  </strong>
                </p>


                <p className="text-gray-600">
                  Flat:{' '}

                  <strong>
                    {
                      selectedEmergency
                        .triggered_by
                        .flat_no
                    }
                  </strong>
                </p>


                <p className="text-gray-600">
                  Time:{' '}

                  <strong>
                    {getTimeAgo(
                      selectedEmergency.triggered_at
                    )}
                  </strong>
                </p>

              </div>


              <div className="space-y-2">

                <Label
                  htmlFor="resolveNotes"
                  className="text-sm font-medium"
                >
                  Resolution Notes (optional)
                </Label>


                <Textarea
                  id="resolveNotes"
                  placeholder="e.g., Technician fixed the issue, power restored..."
                  value={
                    resolveNotes
                  }
                  onChange={(e) =>
                    setResolveNotes(
                      e.target.value
                    )
                  }
                  disabled={
                    resolveLoading
                  }
                  className="resize-none"
                  rows={3}
                />

              </div>

            </div>

          )}


          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">

            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                setResolveDialogOpen(
                  false
                );

                setSelectedEmergency(
                  null
                );

                setResolveNotes('');
              }}
              disabled={
                resolveLoading
              }
            >
              Cancel
            </Button>


            <Button
              variant="default"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
              onClick={
                handleResolve
              }
              disabled={
                resolveLoading
              }
            >

              {resolveLoading ? (

                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />

                  Resolving...
                </>

              ) : (

                <>
                  <CheckCircle className="w-4 h-4 mr-2" />

                  Confirm Resolution
                </>

              )}

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}