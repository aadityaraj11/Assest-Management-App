import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // ADD useMutation
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  QrCode,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast'; // ADD toast

interface Asset {
  _id: string;
  name: string;
  assetTag: string;
  category: string;
  serial: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  location: string;
  purchaseDate: string;
  warrantyUntil: string;
  cost: number;
  vendor: {
    name: string;
  };
  metadata: {
    manufacturer: string;
    model: string;
  };
}

export const AssetsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // ADD queryClient
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', searchTerm, statusFilter],
    queryFn: () => api.getAssets({
      ...(statusFilter && { status: statusFilter }),
      ...(searchTerm && { search: searchTerm }),
    }),
  });

  // ADD delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      toast({ title: 'Asset deleted successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to delete asset', 
        description: error.message,
        variant: 'destructive' 
      });
    },
  });
  
  const typedAssets = assets as Asset[] | undefined;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'assigned':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'retired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canEdit = user?.role === 'admin' || user?.role === 'ops';

  const handleAddAsset = () => {
    navigate('/assets/new');
  };

  // ADD delete handler
  const handleDeleteAsset = (assetId: string, assetName: string) => {
    if (confirm(`Are you sure you want to delete "${assetName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(assetId);
    }
  };

  const handleEditAsset = (assetId: string) => {
    navigate(`/assets/edit/${assetId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Asset Management</h1>
          <p className="text-muted-foreground">Track and manage fire safety equipment</p>
        </div>
        {canEdit && (
          <Button 
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            onClick={handleAddAsset}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search assets by name, tag, or serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="assigned">Assigned</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Fire Safety Assets ({typedAssets?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Cost</TableHead>
                {canEdit && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {typedAssets?.map((asset) => (
                <TableRow key={asset._id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{asset.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {asset.assetTag} • {asset.metadata?.manufacturer} {asset.metadata?.model}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(asset.status)} variant="secondary">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(asset.status)}
                        {asset.status}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>{asset.vendor?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {asset.warrantyUntil ? new Date(asset.warrantyUntil).toLocaleDateString() : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {asset.cost ? `$${asset.cost.toLocaleString()}` : 'N/A'}
                    </span>
                  </TableCell>
                  {canEdit && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditAsset(asset._id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => handleDeleteAsset(asset._id, asset.name)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!typedAssets || typedAssets.length === 0) && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No assets found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first fire safety asset'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};