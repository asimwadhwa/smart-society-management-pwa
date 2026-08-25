'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useEmergency, Emergency } from '@/hooks/useEmergency';
import { AlertTriangle, Phone, Bell, CheckCircle, Clock, History, RefreshCw } from 'lucide-react';

export default function WatchmanEmergencyPage() {
  const { toast } = useToast();
  const {
    activeEmergency,
    loading,
    triggerLoading,
    resolveLoading,
    triggerEmergency,
    resolveEmergency,
    getEmergencyHistory,
    refresh,
  } = useEmergency();

  const [history, setHistory] = useState<Emergency[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [confirmTrigger, setConfirmTrigger] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  // Fetch history
  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await getEmergencyHistory(1, 10);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory();
    }
  }, [showHistory]);

  const handleTrigger = async () => {
    try {
      await triggerEmergency('Triggered by watchman');
      toast({
        title: 'Emergency Triggered!',
        description: 'All residents have been notified',
      });
      setConfirmTrigger(false);
    } catch (error: any) {
      toast({
        title: 'Failed to trigger',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleResolve = async () => {
    if (!activeEmergency) return;
    
    try {
      await resolveEmergency(activeEmergency._id, resolveNotes || 'Resolved by watchman');
      toast({
        title: 'Emergency Resolved',
        description: 'Status updated to resolved',
      });
      setShowResolveForm(false);
      setResolveNotes('');
    } catch (error: any) {
      toast({
        title: 'Failed to resolve',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeSince = (dateString: string) => {
    const start = new Date(dateString).getTime();
    const now = Date.now();
    const minutes = Math.floor((now - start) / 60000);
    
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lift Emergency</h1>
        <p className="text-gray-600">Monitor and manage emergency alerts</p>
      </div>

      {/* Current Status */}
      {loading ? (
        <Card className="animate-pulse">
          <CardContent className="p-8">
            <div className="h-32 bg-gray-100 rounded"></div>
          </CardContent>
        </Card>
      ) : activeEmergency ? (
        /* Active Emergency Card */
        <Card className="border-2 border-red-500 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-6 w-6 animate-pulse" />
              ACTIVE EMERGENCY
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-red-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-semibold">{activeEmergency.triggered_by.name}</p>
                  <Badge variant="destructive" className="mt-1">
                    Flat {activeEmergency.flat_no}
                  </Badge>
                </div>
                <div className="text-right text-sm text-gray-600">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {getTimeSince(activeEmergency.triggered_at)}
                </div>
              </div>
              
              {activeEmergency.notes && (
                <p className="text-gray-700 text-sm mb-3">
                  Note: {activeEmergency.notes}
                </p>
              )}

              {activeEmergency.triggered_by.phone && (
                <a
                  href={`tel:${activeEmergency.triggered_by.phone}`}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-lg font-medium"
                >
                  <Phone className="h-5 w-5" />
                  Call {activeEmergency.triggered_by.phone}
                </a>
              )}
            </div>

            {/* Resolve Section */}
            {!showResolveForm ? (
              <Button
                variant="outline"
                className="w-full border-green-500 text-green-600 hover:bg-green-50"
                onClick={() => setShowResolveForm(true)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
            ) : (
              <div className="space-y-3 p-4 bg-white rounded-lg border">
                <textarea
                  placeholder="Resolution notes (e.g., Person safely evacuated)"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full p-3 border rounded-lg resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowResolveForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleResolve}
                    disabled={resolveLoading}
                  >
                    {resolveLoading ? 'Resolving...' : 'Confirm Resolve'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* No Active Emergency */
        <Card>
          <CardContent className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-700">All Clear</h3>
            <p className="text-gray-600 text-sm">No active emergencies</p>
          </CardContent>
        </Card>
      )}

      {/* Trigger Emergency Button */}
      {!activeEmergency && !confirmTrigger && (
        <Card>
          <CardContent className="py-4">
            <Button
              className="w-full py-6 bg-red-600 hover:bg-red-700 text-lg"
              onClick={() => setConfirmTrigger(true)}
            >
              <Bell className="h-6 w-6 mr-2" />
              Trigger Emergency
            </Button>
            <p className="text-center text-xs text-gray-500 mt-2">
              Only use in actual emergency situations
            </p>
          </CardContent>
        </Card>
      )}

      {/* Confirm Trigger Dialog */}
      {confirmTrigger && (
        <Card className="border-2 border-yellow-500 bg-yellow-50">
          <CardContent className="py-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-2">Confirm Emergency Trigger</h3>
            <p className="text-gray-700 text-sm mb-4">
              This will immediately notify all residents and management.
              Only proceed if there is a real emergency.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmTrigger(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={handleTrigger}
                disabled={triggerLoading}
              >
                {triggerLoading ? 'Triggering...' : 'Confirm Trigger'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emergency History */}
      <Card>
        <CardHeader 
          className="pb-3 cursor-pointer"
          onClick={() => setShowHistory(!showHistory)}
        >
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent History
            </span>
            <span className="text-sm font-normal text-gray-500">
              {showHistory ? '▲ Hide' : '▼ Show'}
            </span>
          </CardTitle>
        </CardHeader>
        
        {showHistory && (
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No emergency history</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className={`p-3 rounded-lg border ${
                      item.status === 'active' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.triggered_by.name}</p>
                          <Badge variant={item.status === 'active' ? 'destructive' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          Flat {item.flat_no} • {formatDateTime(item.triggered_at)}
                        </p>
                      </div>
                    </div>
                    {item.status === 'resolved' && item.resolved_at && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Resolved by {item.resolved_by?.name} at {formatDateTime(item.resolved_at)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Refresh */}
      <Button variant="outline" className="w-full" onClick={refresh}>
        <RefreshCw className="w-4 h-4 mr-2" /> Refresh Status
      </Button>
    </div>
  );
}
