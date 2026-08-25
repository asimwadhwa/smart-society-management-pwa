'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useGateLog, GateLogEntry } from '@/hooks/useGateLog';
import { ClipboardList, RefreshCw } from 'lucide-react';

export default function GateLogPage() {
  const { toast } = useToast();
  const { getTodayEntries, markOutTime } = useGateLog();

  const [entries, setEntries] = useState<GateLogEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, inside: 0, exited: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inside' | 'exited'>('all');

  // Fetch entries
  useEffect(() => {
    fetchEntries();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchEntries, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await getTodayEntries();
      setEntries(response.data);
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkOut = async (entryId: string, visitorName: string) => {
    try {
      await markOutTime(entryId);
      toast({
        title: 'Marked out',
        description: `${visitorName} has exited`,
      });
      fetchEntries();
    } catch (error: any) {
      toast({
        title: 'Failed to mark out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (inTime: string, outTime: string | null) => {
    const start = new Date(inTime).getTime();
    const end = outTime ? new Date(outTime).getTime() : Date.now();
    const minutes = Math.floor((end - start) / 60000);
    
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    if (filter === 'inside') return !entry.out_time;
    if (filter === 'exited') return entry.out_time;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gate Log</h1>
        <p className="text-gray-600">Today's visitor entries</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card
          className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setFilter('all')}
        >
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-gray-500">Total</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${filter === 'inside' ? 'ring-2 ring-green-500' : ''}`}
          onClick={() => setFilter('inside')}
        >
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.inside}</p>
            <p className="text-xs text-gray-500">Inside</p>
          </CardContent>
        </Card>
        <Card
          className={`cursor-pointer transition-all ${filter === 'exited' ? 'ring-2 ring-gray-400' : ''}`}
          onClick={() => setFilter('exited')}
        >
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.exited}</p>
            <p className="text-xs text-gray-500">Exited</p>
          </CardContent>
        </Card>
      </div>

      {/* Entries List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {filter === 'all' && 'All Visitors'}
            {filter === 'inside' && 'Currently Inside'}
            {filter === 'exited' && 'Already Exited'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse h-20 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No entries found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div
                  key={entry._id}
                  className={`p-4 rounded-lg border ${
                    entry.out_time ? 'bg-gray-50 border-gray-200' : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{entry.visitor_name}</p>
                        {!entry.out_time && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Inside</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline">{entry.flat_no_visiting}</Badge>
                        <span>{entry.purpose}</span>
                        {entry.vehicle_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">{entry.vehicle_number}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>In: {formatTime(entry.in_time)}</span>
                        {entry.out_time && (
                          <span>Out: {formatTime(entry.out_time)}</span>
                        )}
                        <span className="font-medium">
                          ({getDuration(entry.in_time, entry.out_time)})
                        </span>
                      </div>
                    </div>
                    {!entry.out_time && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkOut(entry._id, entry.visitor_name)}
                      >
                        Mark Out
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setLoading(true);
          fetchEntries();
        }}
      >
        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
      </Button>
    </div>
  );
}
