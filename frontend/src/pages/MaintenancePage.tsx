import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Plus, Calendar, DollarSign, Wrench, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface MaintenanceRecord {
  _id: string;
  assetId: {
    _id: string;
    name: string;
    assetTag: string;
    category: string;
  } | null;
  vendorId?: {
    _id: string;
    name: string;
    contact: string;
  } | null;
  scheduledAt: string;
  completedAt?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  cost: number;
  notes: string;
  createdAt: string;
}

export const MaintenancePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null);

  const { data: maintenanceRecords, isLoading } = useQuery({
    queryKey: ['maintenance', statusFilter],
    queryFn: () => api.getMaintenance({ 
      ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
    }),
  });

  const { data: assets } = useQuery({
    queryKey: ['assets'],
    queryFn: () => api.getAssets(),
    enabled: isCreateDialogOpen,
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: () => api.getVendors(),
    enabled: isCreateDialogOpen,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.createMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsCreateDialogOpen(false);
      toast({ title: 'Maintenance record created successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to create maintenance record', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.updateMaintenance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsEditDialogOpen(false);
      setSelectedRecord(null);
      toast({ title: 'Maintenance record updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to update maintenance record', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });

  // FIXED: Filter out records where assetId is null (deleted assets)
  const filteredRecords = maintenanceRecords
    ?.filter((record: MaintenanceRecord) => record.assetId !== null) // Remove records with deleted assets
    ?.filter((record: MaintenanceRecord) => {
      const assetName = record.assetId?.name?.toLowerCase() || '';
      const assetTag = record.assetId?.assetTag?.toLowerCase() || '';
      const vendorName = record.vendorId?.name?.toLowerCase() || '';
      
      return (
        assetName.includes(searchTerm.toLowerCase()) ||
        assetTag.includes(searchTerm.toLowerCase()) ||
        vendorName.includes(searchTerm.toLowerCase())
      );
    }) || [];

  const canCreateMaintenance = user?.role === 'admin' || user?.role === 'ops';

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'outline';
      case 'in-progress': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const handleCreateMaintenance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      assetId: formData.get('assetId'),
      vendorId: formData.get('vendorId') || undefined,
      scheduledAt: formData.get('scheduledAt'),
      cost: Number(formData.get('cost')),
      notes: formData.get('notes'),
    });
  };

  const handleUpdateMaintenance = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (selectedRecord) {
      updateMutation.mutate({
        id: selectedRecord._id,
        data: {
          status: formData.get('status'),
          cost: Number(formData.get('cost')),
          notes: formData.get('notes'),
          completedAt: formData.get('status') === 'completed' ? new Date().toISOString() : undefined,
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24 bg-muted/50" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Maintenance Records
          </h1>
          <p className="text-muted-foreground mt-2">
            Track and manage asset maintenance schedules
          </p>
        </div>
        {canCreateMaintenance && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Maintenance</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateMaintenance} className="space-y-4">
                <div>
                  <Label htmlFor="assetId">Asset</Label>
                  <Select name="assetId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets?.map((asset: any) => (
                        <SelectItem key={asset._id} value={asset._id}>
                          {asset.name} ({asset.assetTag})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="vendorId">Vendor (Optional)</Label>
                  <Select name="vendorId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors?.map((vendor: any) => (
                        <SelectItem key={vendor._id} value={vendor._id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="scheduledAt">Scheduled Date</Label>
                  <Input type="datetime-local" name="scheduledAt" required />
                </div>
                <div>
                  <Label htmlFor="cost">Estimated Cost</Label>
                  <Input type="number" name="cost" step="0.01" min="0" required />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea name="notes" placeholder="Maintenance details..." />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Scheduling...' : 'Schedule Maintenance'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search maintenance records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Maintenance Records List */}
      <div className="grid gap-4">
        {filteredRecords.map((record: MaintenanceRecord) => (
          <Card key={record._id} className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-full bg-warning/10">
                    <Wrench className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{record.assetId?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Tag: {record.assetId?.assetTag} • {record.assetId?.category}
                    </p>
                    {record.vendorId && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Building2 className="h-3 w-3" />
                        {record.vendorId.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      {new Date(record.scheduledAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      ${record.cost.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(record.status)}>
                      {record.status}
                    </Badge>
                    {canCreateMaintenance && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              {record.notes && (
                <p className="mt-3 text-sm text-muted-foreground">{record.notes}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecords.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No maintenance records found</h3>
            <p className="text-muted-foreground">
              {canCreateMaintenance ? 'Schedule your first maintenance to get started.' : 'No records match your search.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Maintenance Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Maintenance Record</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <form onSubmit={handleUpdateMaintenance} className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{selectedRecord.assetId?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Scheduled: {new Date(selectedRecord.scheduledAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={selectedRecord.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cost">Cost</Label>
                <Input 
                  type="number" 
                  name="cost" 
                  step="0.01" 
                  min="0" 
                  defaultValue={selectedRecord.cost}
                  required 
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  name="notes" 
                  defaultValue={selectedRecord.notes}
                  placeholder="Maintenance details..." 
                />
              </div>
              <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Updating...' : 'Update Record'}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};