'use client';

import { useState, useEffect } from 'react';
import { useAssets, AssetStats, CreateAssetData, AddServiceData } from '@/hooks/useAssets';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Asset, ServiceLog } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  Building2, 
  Droplets, 
  Zap, 
  Plus, 
  Wrench, 
  Settings, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
  RefreshCw,
  Trash2
} from 'lucide-react';

export default function AdminAssetsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    getAssets, 
    createAsset, 
    updateAssetStatus, 
    addServiceEntry,
    deleteAsset,
    loading 
  } = useAssets();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats>({ total: 0, working: 0, under_maintenance: 0, not_working: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  // Form states
  const [newAsset, setNewAsset] = useState<CreateAssetData>({
    name: '',
    type: 'lift',
    status: 'working',
    location: '',
  });
  const [newStatus, setNewStatus] = useState<'working' | 'under_maintenance' | 'not_working'>('working');
  const [serviceData, setServiceData] = useState<AddServiceData>({
    description: '',
    done_by: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [actionLoading, setActionLoading] = useState(false);

  const isManager = user?.role === 'manager';

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setDataLoading(true);
    try {
      const response = await getAssets();
      setAssets(response.data);
      setStats(response.stats);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch assets',
        variant: 'destructive',
      });
    } finally {
      setDataLoading(false);
    }
  };

  const toggleExpanded = (assetId: string) => {
    setExpandedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'lift':
        return <Building2 className="h-6 w-6" />;
      case 'water_pump':
        return <Droplets className="h-6 w-6" />;
      case 'generator':
        return <Zap className="h-6 w-6" />;
      default:
        return <Settings className="h-6 w-6" />;
    }
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case 'lift':
        return 'Lift';
      case 'water_pump':
        return 'Water Pump';
      case 'generator':
        return 'Generator';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'working':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Working
          </Badge>
        );
      case 'under_maintenance':
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Under Maintenance
          </Badge>
        );
      case 'not_working':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Not Working
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Create Asset
  const handleCreateAsset = async () => {
    if (!newAsset.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Asset name is required',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      await createAsset(newAsset);
      toast({
        title: 'Success',
        description: 'Asset created successfully',
      });
      setCreateDialogOpen(false);
      setNewAsset({ name: '', type: 'lift', status: 'working', location: '' });
      fetchAssets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create asset',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Update Status
  const openStatusDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setNewStatus(asset.status);
    setStatusDialogOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedAsset) return;

    setActionLoading(true);
    try {
      await updateAssetStatus(selectedAsset._id, newStatus);
      toast({
        title: 'Status Updated',
        description: `Asset status changed to ${newStatus.replace('_', ' ')}`,
      });
      setStatusDialogOpen(false);
      fetchAssets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Add Service Entry
  const openServiceDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setServiceData({
      description: '',
      done_by: '',
      date: new Date().toISOString().split('T')[0],
    });
    setServiceDialogOpen(true);
  };

  const handleAddService = async () => {
    if (!selectedAsset) return;

    if (!serviceData.description.trim() || !serviceData.done_by.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Description and technician name are required',
        variant: 'destructive',
      });
      return;
    }

    setActionLoading(true);
    try {
      await addServiceEntry(selectedAsset._id, serviceData);
      toast({
        title: 'Service Logged',
        description: 'Service entry added successfully',
      });
      setServiceDialogOpen(false);
      fetchAssets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add service entry',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Asset
  const openDeleteDialog = (asset: Asset) => {
    setSelectedAsset(asset);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset) return;

    setActionLoading(true);
    try {
      await deleteAsset(selectedAsset._id);
      toast({
        title: 'Asset Deleted',
        description: 'Asset has been removed',
      });
      setDeleteDialogOpen(false);
      fetchAssets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete asset',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
          <p className="text-gray-600 mt-1">Manage society assets and service records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAssets} disabled={dataLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {isManager && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Working</p>
                <p className="text-2xl font-bold text-green-600">{stats.working}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-amber-600">{stats.under_maintenance}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Working</p>
                <p className="text-2xl font-bold text-red-600">{stats.not_working}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assets Grid */}
      {dataLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : assets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Assets Found</h3>
            <p className="text-gray-600 mt-1">
              {isManager ? 'Add your first asset to get started.' : 'No assets have been registered yet.'}
            </p>
            {isManager && (
              <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Asset
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assets.map((asset) => (
            <Card key={asset._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      asset.status === 'working' ? 'bg-green-100 text-green-600' :
                      asset.status === 'under_maintenance' ? 'bg-amber-100 text-amber-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {getAssetIcon(asset.type)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <CardDescription>{getAssetTypeLabel(asset.type)}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(asset.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Details */}
                <div className="space-y-2 text-sm">
                  {asset.location && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{asset.location}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Service:</span>
                    <span className="font-medium">{formatDate(asset.last_service_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Services:</span>
                    <span className="font-medium">{asset.services?.length || 0}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openStatusDialog(asset)}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    Status
                  </Button>
                  {isManager && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => openServiceDialog(asset)}
                      >
                        <Wrench className="h-4 w-4 mr-1" />
                        Service
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => openDeleteDialog(asset)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Service History */}
                {asset.services && asset.services.length > 0 && (
                  <Collapsible 
                    open={expandedAssets.has(asset._id)}
                    onOpenChange={() => toggleExpanded(asset._id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Service History ({asset.services.length})
                        </span>
                        {expandedAssets.has(asset._id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {[...asset.services].reverse().map((service, index) => (
                          <div 
                            key={service._id || index}
                            className="p-3 bg-gray-50 rounded-lg text-sm"
                          >
                            <div className="flex justify-between mb-1">
                              <span className="font-medium">{formatDate(service.date)}</span>
                              <span className="text-gray-600">by {service.done_by}</span>
                            </div>
                            <p className="text-gray-700">{service.description}</p>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Asset Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Add a new asset to track and manage.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Main Lift, Backup Generator"
                value={newAsset.name}
                onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="type">Asset Type *</Label>
              <Select
                value={newAsset.type}
                onValueChange={(value) => setNewAsset({ ...newAsset, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lift">Lift</SelectItem>
                  <SelectItem value="water_pump">Water Pump</SelectItem>
                  <SelectItem value="generator">Generator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={newAsset.status}
                onValueChange={(value) => setNewAsset({ ...newAsset, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="not_working">Not Working</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                placeholder="e.g., Building A, Ground Floor"
                value={newAsset.location}
                onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAsset} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Asset Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedAsset?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Status</Label>
              <div className="mt-1">{selectedAsset && getStatusBadge(selectedAsset.status)}</div>
            </div>
            <div>
              <Label htmlFor="newStatus">New Status</Label>
              <Select
                value={newStatus}
                onValueChange={(value) => setNewStatus(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="not_working">Not Working</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Service Entry</DialogTitle>
            <DialogDescription>
              Add a service record for {selectedAsset?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="serviceDate">Service Date</Label>
              <Input
                id="serviceDate"
                type="date"
                value={serviceData.date}
                onChange={(e) => setServiceData({ ...serviceData, date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="doneBy">Technician Name *</Label>
              <Input
                id="doneBy"
                placeholder="e.g., Ramesh Kumar"
                value={serviceData.done_by}
                onChange={(e) => setServiceData({ ...serviceData, done_by: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Service Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the service performed..."
                rows={3}
                value={serviceData.description}
                onChange={(e) => setServiceData({ ...serviceData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddService} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Service Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedAsset?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAsset} disabled={actionLoading}>
              {actionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
