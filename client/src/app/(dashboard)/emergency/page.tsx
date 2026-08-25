'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmergency, Emergency, EmergencyHistory } from '@/hooks/useEmergency';
import { useToast } from '@/hooks/use-toast';
import EmergencyButton from '@/components/dashboard/EmergencyButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Siren, Mail, Bell, CheckCircle, ArrowUpDown, ClipboardList, Loader2 } from 'lucide-react';

export default function EmergencyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    activeEmergency,
    triggerEmergency,
    resolveEmergency,
    getEmergencyHistory,
  } = useEmergency();

  const [history, setHistory] = useState<EmergencyHistory | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  const isManagerOrAdmin = user?.role === 'manager' || user?.role === 'admin';
  const hasActiveEmergency = activeEmergency !== null;

  const fetchHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const data = await getEmergencyHistory(page, 10);
      setHistory(data);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, [getEmergencyHistory]);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const handleTrigger = async (notes?: string) => {
    setTriggerLoading(true);
    try {
      await triggerEmergency(notes);
      toast({
        title: 'Emergency alert sent!',
        description: 'All residents and staff have been notified.',
      });
      fetchHistory(1); // Refresh history
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again';
      toast({
        title: 'Failed to send alert',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTriggerLoading(false);
    }
  };

  const openResolveDialog = (emergency: Emergency) => {
    setSelectedEmergency(emergency);
    setResolveNotes('');
    setResolveDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!selectedEmergency) return;

    setResolveLoading(true);
    try {
      await resolveEmergency(selectedEmergency._id, resolveNotes);
      toast({
        title: 'Emergency resolved!',
        description: 'All residents have been notified that the situation is resolved.',
      });
      setResolveDialogOpen(false);
      fetchHistory(1); // Refresh history
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Please try again';
      toast({
        title: 'Failed to resolve emergency',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setResolveLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getResponseTime = (emergency: Emergency) => {
    if (!emergency.resolved_at) return null;
    const start = new Date(emergency.triggered_at).getTime();
    const end = new Date(emergency.resolved_at).getTime();
    const minutes = Math.floor((end - start) / 60000);
    if (minutes < 1) return 'Under 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lift Emergency</h1>
        <p className="text-gray-600 mt-1">
          Trigger an emergency alert or view history
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Emergency Button */}
        <div className="space-y-6">
          {/* Emergency Trigger */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Siren className="w-4 h-4 text-red-600" />
                </div>
                Emergency Alert
              </CardTitle>
              <CardDescription>
                Use this button if you or someone is stuck in the lift
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmergencyButton
                onTrigger={handleTrigger}
                hasActiveEmergency={hasActiveEmergency}
                userFlat={user?.flat_no || 'Unknown'}
                triggerLoading={triggerLoading}
              />
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">What happens when you trigger?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-gray-500">
                    All residents, manager, and watchman receive instant email alerts
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Dashboard Alert</p>
                  <p className="text-sm text-gray-500">
                    A red banner appears on everyone&apos;s dashboard
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Resolution</p>
                  <p className="text-sm text-gray-500">
                    Manager or Admin will resolve the emergency once help arrives
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Active Emergency */}
        <div className="space-y-6">
          {/* Active Emergency Card */}
          <Card className={`border-0 shadow-sm ${hasActiveEmergency ? 'border-red-300 bg-red-50' : ''}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {hasActiveEmergency ? (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center animate-pulse">
                      <Siren className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="text-red-600">Active Emergency</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-green-600">All Clear</span>
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {hasActiveEmergency
                  ? 'An emergency alert is currently active'
                  : 'No active emergencies at this time'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasActiveEmergency && activeEmergency ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg border border-red-200 p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-red-700">
                          Triggered by: {activeEmergency.triggered_by.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Flat {activeEmergency.triggered_by.flat_no} • {getTimeAgo(activeEmergency.triggered_at)}
                        </p>
                      </div>
                      <Badge variant="destructive" className="animate-pulse">
                        ACTIVE
                      </Badge>
                    </div>

                    {activeEmergency.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                        <p className="text-sm text-yellow-800">
                          <strong>Note:</strong> {activeEmergency.notes}
                        </p>
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      {formatDate(activeEmergency.triggered_at)}
                    </p>

                    {isManagerOrAdmin && (
                      <Button
                        variant="default"
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => openResolveDialog(activeEmergency)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> Mark as Resolved
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ArrowUpDown className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>The lift is operating normally</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          {history && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      {history.pagination.total}
                    </p>
                    <p className="text-sm text-gray-500">Total Alerts</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {history.data.filter((e: Emergency) => e.status === 'resolved').length}
                    </p>
                    <p className="text-sm text-gray-500">Resolved</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* History Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            Emergency History
          </CardTitle>
          <CardDescription>
            Past emergency alerts and their resolutions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : history && history.data.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Triggered By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resolved By</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.data.map((emergency: Emergency) => (
                      <TableRow key={emergency._id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(emergency.triggered_at)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{emergency.triggered_by.name}</p>
                            <p className="text-xs text-gray-500">
                              Flat {emergency.triggered_by.flat_no}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={emergency.status === 'active' ? 'destructive' : 'default'}
                            className={
                              emergency.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : ''
                            }
                          >
                            {emergency.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {emergency.resolved_by ? (
                            <div>
                              <p className="font-medium">{emergency.resolved_by.name}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getResponseTime(emergency) || (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="truncate text-sm text-gray-600">
                            {emergency.notes || '—'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {history.pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => fetchHistory(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-sm text-gray-600">
                    Page {currentPage} of {history.pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === history.pagination.pages}
                    onClick={() => fetchHistory(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl block mb-2">📭</span>
              <p>No emergency history yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={(open) => {
        if (!resolveLoading) {
          setResolveDialogOpen(open);
          if (!open) {
            setSelectedEmergency(null);
            setResolveNotes('');
          }
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              Resolve Emergency
            </DialogTitle>
            <DialogDescription>
              Confirm that the emergency has been resolved and help has arrived.
            </DialogDescription>
          </DialogHeader>

          {selectedEmergency && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p className="text-gray-600">
                  Triggered by: <strong>{selectedEmergency.triggered_by.name}</strong>
                </p>
                <p className="text-gray-600">
                  Flat: <strong>{selectedEmergency.triggered_by.flat_no}</strong>
                </p>
                <p className="text-gray-600">
                  Time: <strong>{getTimeAgo(selectedEmergency.triggered_at)}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolveNotes" className="text-sm font-medium">
                  Resolution Notes (optional)
                </Label>
                <Textarea
                  id="resolveNotes"
                  placeholder="e.g., Technician fixed the issue, power restored..."
                  value={resolveNotes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResolveNotes(e.target.value)}
                  disabled={resolveLoading}
                  className="resize-none"
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setResolveDialogOpen(false);
                setSelectedEmergency(null);
                setResolveNotes('');
              }}
              disabled={resolveLoading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700"
              onClick={handleResolve}
              disabled={resolveLoading}
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
